import { Song } from '../../models/Song';

/**
 * Shared types, constants, and pure helpers for the Picture-in-Picture video
 * player. The stateful player logic lives in `usePipPlayer`, the floating
 * control bar in `PipControlBar`, and the context/provider in `VideoPipContext`.
 */

export type VideoInfo = {
    videoId: string;
    title: string;
    // kept so the pip can key prev/next off the song's position in the playlist
    song: Song;
};

export const PLAYER_FRAME_ID = 'ea-pip-player-frame';

// youtube player states (from the IFrame API / postMessage protocol)
export const YT_PLAYING = 1;
export const YT_ENDED = 0;
export const YT_BUFFERING = 3;

export const PIP_MARGIN = 16;
export const PIP_MAX_WIDTH = 360;
// vertical room reserved below the pip video for the control bar (bar height +
// its top margin), so the bar stays on-screen above the viewport edge
export const PIP_BAR_SPACE = 40;

export const AUTO_CONTINUE_KEY = 'ea-pip-autocontinue';

export type Geom = { left: number; top: number; width: number; height: number };

export const buildSrc = (videoId: string): string => {
    const origin = encodeURIComponent(window.location.origin);
    // enablejsapi=1 turns on the postMessage protocol so we can read play state.
    // clicking a thumbnail is an explicit "play this", so always autoplay.
    return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${origin}&rel=0&playsinline=1&widgetid=1&autoplay=1`;
};

export const youtubeWatchUrl = (videoId: string, seconds?: number): string => {
    const t = seconds && seconds > 1 ? `&t=${Math.floor(seconds)}s` : '';
    return `https://www.youtube.com/watch?v=${videoId}${t}`;
};

export const getYouTubeThumbnailUrl = (videoId: string | null): string | null => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// build the player payload for a song, or null if it has no video.
// note: `youtubeUrl` in the data is already the bare video id.
export const videoInfoFor = (song: Song): VideoInfo | null => {
    const videoId = song.youtubeUrl;
    if (!videoId) return null;
    const artist = song.artist?.name;
    return {
        videoId,
        title: artist ? `${artist} - ${song.name}` : song.name,
        song,
    };
};

// geometry of the floating pip. with no `pos` it sits in the default
// bottom-right corner; with one (user dragged it) it honors that position,
// clamped so the video and its control bar stay fully on-screen.
export const computePipGeom = (pos?: { left: number; top: number } | null): Geom => {
    const width = Math.min(PIP_MAX_WIDTH, window.innerWidth - PIP_MARGIN * 2);
    const height = Math.round((width * 9) / 16);
    const maxLeft = window.innerWidth - width - PIP_MARGIN;
    const maxTop = window.innerHeight - height - PIP_MARGIN - PIP_BAR_SPACE;
    if (pos) {
        return {
            left: Math.max(PIP_MARGIN, Math.min(pos.left, maxLeft)),
            top: Math.max(PIP_MARGIN, Math.min(pos.top, maxTop)),
            width,
            height,
        };
    }
    return { left: maxLeft, top: maxTop, width, height };
};
