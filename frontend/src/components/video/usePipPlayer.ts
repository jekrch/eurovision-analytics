import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
    VideoInfo,
    Geom,
    PLAYER_FRAME_ID,
    YT_PLAYING,
    YT_ENDED,
    YT_BUFFERING,
    AUTO_CONTINUE_KEY,
    videoInfoFor,
    computePipGeom,
    youtubeWatchUrl,
} from './videoPipShared';
import { Song } from '../../models/Song';

/**
 * The stateful Picture-in-Picture player engine: it owns the single iframe's
 * video state, the playlist used for prev/next/auto-continue, drag handling,
 * and the YouTube postMessage play-state tracking. The provider renders the
 * DOM; this hook drives it.
 */
export const usePipPlayer = () => {
    // `video` drives the portal/iframe; null means no player mounted at all
    const [video, setVideo] = useState<VideoInfo | null>(null);
    // when on, a finished video advances to the next song in the playlist
    // instead of closing
    const [autoContinue, setAutoContinue] = useState<boolean>(() => {
        try {
            return localStorage.getItem(AUTO_CONTINUE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    // the list the clicked song came from (e.g. a sorted song table) drives
    // prev/next navigation
    const playlistRef = useRef<Song[]>([]);
    const [canNavigate, setCanNavigate] = useState(false);
    const autoContinueRef = useRef(autoContinue);
    autoContinueRef.current = autoContinue;
    // guards against YouTube's repeated "ended" messages double-advancing the
    // auto-continue; released once the next track actually starts playing
    const advancingRef = useRef(false);

    const videoRef = useRef<VideoInfo | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerStateRef = useRef<number>(-1);
    const currentTimeRef = useRef<number>(0);
    // set when the pip goes from nothing -> mounted, so it animates in once
    const openingRef = useRef(false);

    // running exit-animation timer / guard so a closing pip animates out once
    // before it's torn down (rather than vanishing instantly)
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closingRef = useRef(false);
    // user-chosen pip position (from dragging the control bar); null = default
    // bottom-right corner. reset each fresh open so the pip reappears there.
    const pipPosRef = useRef<{ left: number; top: number } | null>(null);

    const applyGeom = useCallback((geom: Geom) => {
        const el = containerRef.current;
        if (!el) return;
        el.style.left = `${geom.left}px`;
        el.style.top = `${geom.top}px`;
        el.style.width = `${geom.width}px`;
        el.style.height = `${geom.height}px`;
    }, []);

    const positionNow = useCallback(() => {
        applyGeom(computePipGeom(pipPosRef.current));
    }, [applyGeom]);

    const postCommand = useCallback((func: string, args: unknown[] = []) => {
        const w = iframeRef.current?.contentWindow;
        if (!w) return;
        try {
            w.postMessage(
                JSON.stringify({ event: 'command', func, args, id: PLAYER_FRAME_ID, channel: 'widget' }),
                '*',
            );
        } catch {
            /* ignore */
        }
    }, []);

    // abort an in-flight exit animation and clear the faded-out styles, so the
    // same container can be reused to load a new video cleanly
    const cancelClose = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        closingRef.current = false;
        const el = containerRef.current;
        if (el) {
            el.style.transition = '';
            el.style.opacity = '';
            el.style.transform = '';
        }
    }, []);

    // swap in a different video. geometry stays put, so an open pip doesn't
    // move — only the iframe src changes.
    const loadVideo = useCallback(
        (info: VideoInfo) => {
            cancelClose();
            if (!videoRef.current) {
                // fresh open lands in the default corner
                pipPosRef.current = null;
                openingRef.current = true;
            }
            playerStateRef.current = -1;
            currentTimeRef.current = 0;
            videoRef.current = info;
            setVideo(info);
        },
        [cancelClose],
    );

    // play `song` in the pip; `playlist` is the list it was picked from, used
    // for prev/next and auto-continue
    const play = useCallback(
        (song: Song, playlist: Song[] = [song]) => {
            playlistRef.current = playlist.filter((s) => !!s.youtubeUrl);
            setCanNavigate(playlistRef.current.length > 1);
            const info = videoInfoFor(song);
            if (!info) return;
            if (videoRef.current?.videoId === info.videoId) {
                // already loaded; if it was mid-close, rescue it and resume
                if (closingRef.current) {
                    cancelClose();
                    postCommand('playVideo');
                }
                return;
            }
            advancingRef.current = false;
            loadVideo(info);
        },
        [loadVideo, cancelClose, postCommand],
    );

    // rip the player out of the DOM and stop everything
    const teardownPlayer = useCallback(() => {
        videoRef.current = null;
        setVideo(null);
    }, []);

    const closePip = useCallback(() => {
        if (closingRef.current) return;
        // pause the embed straight away so audio stops while it animates out
        postCommand('pauseVideo');
        const el = containerRef.current;
        if (!el) {
            teardownPlayer();
            return;
        }
        // shrink/fade the floating box toward its corner, then unmount once
        // the transition has played
        closingRef.current = true;
        el.style.transition = 'opacity 220ms ease, transform 240ms cubic-bezier(0.4,0,0.7,1)';
        el.style.transformOrigin = 'bottom right';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.82) translateY(12px)';
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            closingRef.current = false;
            teardownPlayer();
        }, 240);
    }, [postCommand, teardownPlayer]);

    // hand the video off to youtube.com at the current timestamp
    const openOnYouTube = useCallback(() => {
        const info = videoRef.current;
        if (!info) return;
        window.open(youtubeWatchUrl(info.videoId, currentTimeRef.current), '_blank', 'noopener,noreferrer');
        closePip();
    }, [closePip]);

    // drag the floating pip around by grabbing its control bar. clicks that
    // land on a control button fall through to that button instead of dragging.
    const onBarPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if ((e.target as HTMLElement).closest('button')) return;
            const el = containerRef.current;
            if (!el) return;
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const baseLeft = rect.left;
            const baseTop = rect.top;
            // the iframe would swallow pointer events mid-drag if the cursor
            // slides over it
            const frame = iframeRef.current;
            if (frame) frame.style.pointerEvents = 'none';

            const onMove = (ev: PointerEvent) => {
                pipPosRef.current = {
                    left: baseLeft + (ev.clientX - startX),
                    top: baseTop + (ev.clientY - startY),
                };
                applyGeom(computePipGeom(pipPosRef.current));
            };
            const onUp = () => {
                if (frame) frame.style.pointerEvents = '';
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [applyGeom],
    );

    // step to the adjacent playlist song, wrapping at the ends.
    // dir = +1 -> next, -1 -> previous.
    const navigate = useCallback(
        (dir: 1 | -1) => {
            const current = videoRef.current?.song;
            const playable = playlistRef.current;
            if (!current || playable.length < 2) return;
            const idx = playable.findIndex((s) => s.id === current.id);
            // if the current video isn't in the list, enter from the matching end
            const from = idx === -1 ? (dir === 1 ? -1 : 0) : idx;
            const nextIdx = (from + dir + playable.length) % playable.length;
            const info = videoInfoFor(playable[nextIdx]);
            if (info) loadVideo(info);
        },
        [loadVideo],
    );

    const toggleAutoContinue = useCallback(() => {
        setAutoContinue((on) => {
            const next = !on;
            try {
                localStorage.setItem(AUTO_CONTINUE_KEY, String(next));
            } catch {
                /* ignore storage errors (e.g. private mode) */
            }
            return next;
        });
    }, []);

    // seed the container's geometry before first paint so it never flashes at
    // 0,0, and pop it in on a fresh open
    useLayoutEffect(() => {
        if (!video) return;
        positionNow();
        const el = containerRef.current;
        if (el && openingRef.current) {
            openingRef.current = false;
            el.style.transition = 'none';
            el.style.transformOrigin = 'bottom right';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.82) translateY(12px)';
            // force a reflow so the start state sticks before transitioning
            void el.offsetWidth;
            el.style.transition = 'opacity 220ms ease, transform 300ms cubic-bezier(0.16,1,0.3,1)';
            el.style.opacity = '';
            el.style.transform = '';
        }
    }, [video, positionNow]);

    // keep the pip on-screen when the viewport resizes
    useEffect(() => {
        const onResize = () => {
            if (videoRef.current) positionNow();
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [positionNow]);

    // listen for the YouTube embed's postMessage events to track play state
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (typeof e.data !== 'string') return;
            if (e.origin && e.origin.indexOf('youtube') === -1) return;
            let data: { event?: string; info?: number | { playerState?: number; currentTime?: number } } | null;
            try {
                data = JSON.parse(e.data);
            } catch {
                return;
            }
            if (!data) return;

            let state: number | undefined;
            if (data.event === 'onStateChange' && typeof data.info === 'number') {
                state = data.info;
            } else if (data.event === 'infoDelivery' && typeof data.info === 'object' && data.info !== null) {
                if (typeof data.info.currentTime === 'number') {
                    currentTimeRef.current = data.info.currentTime;
                }
                if (typeof data.info.playerState === 'number') {
                    state = data.info.playerState;
                }
            }
            if (state === undefined) return;

            playerStateRef.current = state;
            // a started track clears the auto-continue lock for the next ending
            if (state === YT_PLAYING || state === YT_BUFFERING) {
                advancingRef.current = false;
            }
            // when a video finishes: advance to the next track if auto-continue
            // is on, otherwise retire the pip. youtube fires the ended state
            // repeatedly, so the lock keeps us from skipping ahead.
            if (state === YT_ENDED) {
                if (autoContinueRef.current && playlistRef.current.length > 1) {
                    if (!advancingRef.current) {
                        advancingRef.current = true;
                        navigate(1);
                    }
                } else {
                    closePip();
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [closePip, navigate]);

    // full teardown on provider unmount
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    // open the postMessage channel once the embed has loaded so play-state
    // events start flowing
    const handleIframeLoad = useCallback(() => {
        const w = iframeRef.current?.contentWindow;
        if (!w) return;
        const post = (msg: object) => {
            try {
                w.postMessage(JSON.stringify(msg), '*');
            } catch {
                /* ignore */
            }
        };
        const handshake = () => {
            post({ event: 'listening', id: PLAYER_FRAME_ID, channel: 'widget' });
            post({
                event: 'command',
                func: 'addEventListener',
                args: ['onStateChange'],
                id: PLAYER_FRAME_ID,
                channel: 'widget',
            });
        };
        // retry briefly in case the widget isn't ready for the first handshake
        handshake();
        let tries = 0;
        const interval = setInterval(() => {
            tries += 1;
            handshake();
            if (tries >= 6) clearInterval(interval);
        }, 250);
    }, []);

    return {
        // render state
        video,
        autoContinue,
        canNavigate,
        containerRef,
        iframeRef,
        handleIframeLoad,
        // control-bar actions
        navigate,
        toggleAutoContinue,
        openOnYouTube,
        closePip,
        onBarPointerDown,
        // context actions / derived
        play,
        activeVideoId: video?.videoId ?? null,
    };
};
