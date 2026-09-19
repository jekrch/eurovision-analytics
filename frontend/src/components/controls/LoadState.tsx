import React from 'react';
import { spinner } from '../../theme';

/** Spinner while the shared contest data loads, or the error if it failed. */
const LoadState: React.FC<{ error: string | null }> = ({ error }) => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10">
        <div className="flex items-center justify-center h-44">
            {error ? (
                <p className="text-sm text-[var(--er-text-muted)]">Couldn't load voting data: {error}</p>
            ) : (
                <div className={spinner}></div>
            )}
        </div>
    </div>
);

export default LoadState;
