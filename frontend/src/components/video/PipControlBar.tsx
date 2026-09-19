import React from 'react';

interface PipControlBarProps {
    autoContinue: boolean;
    canNavigate: boolean;
    onBarPointerDown: (e: React.PointerEvent) => void;
    navigate: (dir: 1 | -1) => void;
    toggleAutoContinue: () => void;
    openOnYouTube: () => void;
    closePip: () => void;
}

const Icon: React.FC<{ d: string; className?: string }> = ({ d, className = 'w-3 h-3' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
    </svg>
);

const ICON_PREV = 'M15 18l-6-6 6-6';
const ICON_NEXT = 'M9 18l6-6-6-6';
const ICON_INFINITY = 'M18.18 8.18a5.5 5.5 0 1 1 0 7.64L12 12l-6.18-3.82a5.5 5.5 0 1 0 0 7.64L12 12';
const ICON_EXTERNAL = 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3';
const ICON_CLOSE = 'M18 6L6 18M6 6l12 12';

const iconButton = 'flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent';

/**
 * The floating pip's control bar — prev/next, auto-continue toggle, open on
 * YouTube, and close. It sits just below the pip video (outside the clipped
 * video box so it can extend past the bottom edge) and doubles as the drag
 * handle.
 */
const PipControlBar: React.FC<PipControlBarProps> = ({
    autoContinue,
    canNavigate,
    onBarPointerDown,
    navigate,
    toggleAutoContinue,
    openOnYouTube,
    closePip,
}) => {
    return (
        <div
            onPointerDown={onBarPointerDown}
            title="Drag to move"
            className="absolute inset-x-0 top-full mt-1 flex cursor-grab select-none items-center gap-0.5 rounded-md bg-black/85 px-1 py-1 text-white/90 shadow-lg active:cursor-grabbing touch-none"
        >
            <button
                type="button"
                aria-label="Previous video"
                title="Previous"
                disabled={!canNavigate}
                onClick={() => navigate(-1)}
                className={iconButton}
            >
                <Icon d={ICON_PREV} />
            </button>
            <button
                type="button"
                aria-label="Next video"
                title="Next"
                disabled={!canNavigate}
                onClick={() => navigate(1)}
                className={`${iconButton} ml-2`}
            >
                <Icon d={ICON_NEXT} />
            </button>
            <button
                type="button"
                aria-label="Autoplay next video"
                aria-pressed={autoContinue}
                title={autoContinue ? 'Auto-continue on' : 'Auto-continue to next video'}
                onClick={toggleAutoContinue}
                className={`flex h-7 items-center gap-1 rounded px-1.5 ml-3 text-[0.65rem] font-semibold uppercase tracking-wide ${
                    autoContinue
                        ? 'bg-white/90 text-black'
                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
            >
                <Icon d={ICON_INFINITY} />
                Auto
            </button>

            <div className="flex-1" />

            <button
                type="button"
                aria-label="Open on YouTube"
                title="Open on YouTube"
                onClick={openOnYouTube}
                className={`${iconButton} mr-3`}
            >
                <Icon d={ICON_EXTERNAL} />
            </button>
            <button
                type="button"
                aria-label="Close video"
                title="Close"
                onClick={closePip}
                className={iconButton}
            >
                <Icon d={ICON_CLOSE} className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export default PipControlBar;
