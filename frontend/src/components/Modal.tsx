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

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        }
    }, [isOpen]);

    const handleAnimationEnd = () => {
        // When the fade-out animation ends (isRendered is false), call the parent's onClose.
        if (!isOpen) {
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

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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
                className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out ${
                    isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
                }`}
                onClick={handleClose}
            />
            
            {/* Modal content with fade and scale effect */}
            <div
                className={`relative w-full ${maxWidth} max-h-[90vh] bg-slate-800 shadow-xl rounded-lg flex flex-col transform transition-all duration-300 ease-in-out ${
                    isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
                        <button
                            onClick={handleClose}
                            className="rounded-full p-1 hover:bg-slate-600 transition-colors"
                            aria-label="Close modal"
                        >
                            <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-slate-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;