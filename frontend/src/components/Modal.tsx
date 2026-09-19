import React, { useEffect, useState, useCallback } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-6xl',
    footer
}) => {
    // This state controls the mounting/unmounting with a delay for animations.
    const [isRendered, setIsRendered] = useState(false);
    // This state controls the animation classes
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // Small delay to ensure the element is mounted before starting animation
            const timer = setTimeout(() => {
                setIsAnimating(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [isOpen]);

    const handleAnimationEnd = () => {
        // When the fade-out animation ends, unmount the component
        if (!isOpen && !isAnimating) {
            setIsRendered(false);
        }
    };

    // Memoize the closing function to prevent re-creation on each render.
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [handleClose]);

    // Render the component only if `isRendered` is true.
    if (!isRendered) {
        return null;
    }

    return (
        <div
            // Base classes for the container
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
            // Add transitionend listener to know when to unmount
            onTransitionEnd={handleAnimationEnd}
        >
            {/* Backdrop with fade effect */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
                    isAnimating ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />
            
            {/* Modal content with fade and scale effect */}
            <div
                className={`relative w-full ${maxWidth} max-h-[90vh] bg-[var(--er-surface-secondary)] text-[var(--er-text-tertiary)] rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50 flex flex-col transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div className="relative flex items-center justify-between gap-3 px-6 py-4 mb-4">
                        <h3 className="text-base font-semibold text-[var(--er-text-primary)] leading-tight truncate">{title}</h3>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                            aria-label="Close modal"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14" aria-hidden="true">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                            </svg>
                        </button>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-white/5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};


export default Modal;