import classNames from 'classnames';
import React from 'react';

interface SegmentedControlProps<T extends string> {
    options: { value: T; label: string; disabled?: boolean }[];
    value: T;
    onChange: (value: T) => void;
    ariaLabel: string;
    className?: string;
}

/** A row of mutually exclusive toggle buttons. */
function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedControlProps<T>) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={classNames(
                'inline-flex rounded-lg p-0.5 bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_25%,transparent)] ring-1 ring-inset ring-[var(--er-border-subtle)]',
                className
            )}
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={option.disabled}
                        onClick={() => onChange(option.value)}
                        className={classNames(
                            'px-3 h-[1.9rem] rounded-md text-xs font-semibold whitespace-nowrap transition-colors duration-150',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--er-focus-ring)]',
                            selected
                                ? 'bg-[var(--er-button-primary)] text-[var(--er-surface-primary)] shadow-sm'
                                : 'text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)]',
                            option.disabled && 'opacity-40 cursor-not-allowed hover:text-[var(--er-text-subtle)]'
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export default SegmentedControl;
