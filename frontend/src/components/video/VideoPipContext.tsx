import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

import PipControlBar from './PipControlBar';
import { usePipPlayer } from './usePipPlayer';
import { buildSrc, PLAYER_FRAME_ID } from './videoPipShared';
import { Song } from '../../models/Song';

/**
 * Picture-in-Picture video support, ported from eurovision-ranker.
 *
 * Clicking a song's video thumbnail floats a single YouTube <iframe> in a
 * fixed-position box portaled to <body> (bottom-right by default, draggable by
 * its control bar). Because it lives outside the page tree it keeps playing
 * while the user opens/closes modals or switches dashboards. The control bar
 * steps prev/next through the list the song was clicked from, and can
 * auto-continue down that list.
 *
 * We talk to the embed over YouTube's postMessage JSON protocol
 * (enablejsapi=1) rather than loading the IFrame Player API script, to read
 * play state (for auto-continue) and the current time (for "open on YouTube").
 */

interface VideoPipContextValue {
    // play `song` in the floating player; `playlist` is the list it was picked
    // from, used for prev/next and auto-continue
    play: (song: Song, playlist?: Song[]) => void;
    // videoId of the currently loaded video, or null. lets lists flag the live row.
    activeVideoId: string | null;
}

const VideoPipContext = createContext<VideoPipContextValue | null>(null);

export const useVideoPip = (): VideoPipContextValue => {
    const ctx = useContext(VideoPipContext);
    if (!ctx) {
        throw new Error('useVideoPip must be used within a VideoPipProvider');
    }
    return ctx;
};

export const VideoPipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        video,
        autoContinue,
        canNavigate,
        containerRef,
        iframeRef,
        handleIframeLoad,
        navigate,
        toggleAutoContinue,
        openOnYouTube,
        closePip,
        onBarPointerDown,
        play,
        activeVideoId,
    } = usePipPlayer();

    return (
        <VideoPipContext.Provider value={{ play, activeVideoId }}>
            {children}
            {video &&
                createPortal(
                    <div
                        ref={containerRef}
                        className="fixed"
                        // geometry is written imperatively by usePipPlayer (before
                        // first paint), so re-renders never clobber a dragged position.
                        // z-index sits above the song table modal (z-50)
                        style={{ zIndex: 1000 }}
                    >
                        {/* control bar — sits just below the floating video.
                            lives outside the clipped video box so it can extend
                            past the bottom edge */}
                        <PipControlBar
                            autoContinue={autoContinue}
                            canNavigate={canNavigate}
                            onBarPointerDown={onBarPointerDown}
                            navigate={navigate}
                            toggleAutoContinue={toggleAutoContinue}
                            openOnYouTube={openOnYouTube}
                            closePip={closePip}
                        />

                        <div
                            className="absolute inset-0 overflow-hidden rounded-md bg-black"
                            style={{
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                outline: '1px solid var(--er-border-secondary)',
                                outlineOffset: '-1px',
                            }}
                        >
                            <iframe
                                ref={iframeRef}
                                id={PLAYER_FRAME_ID}
                                className="absolute inset-0 h-full w-full"
                                src={buildSrc(video.videoId)}
                                title={video.title}
                                onLoad={handleIframeLoad}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                    </div>,
                    document.body,
                )}
        </VideoPipContext.Provider>
    );
};
