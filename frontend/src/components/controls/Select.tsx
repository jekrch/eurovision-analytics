import classNames from 'classnames';
import React from 'react';

interface SelectProps {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    ariaLabel: string;
    className?: string;
}

/** A native select dressed like CountryDropdown's trigger, for short lists such as years. */
const Select: React.FC<SelectProps> = ({ value, options, onChange, ariaLabel, className }) => (
    <div className={classNames('relative inline-block', className)}>
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={classNames(
                'appearance-none h-[2.25em] rounded-lg pl-3 pr-8 text-sm font-bold cursor-pointer',
                'border border-[var(--er-border-tertiary)] text-[var(--er-text-subtle)]',
                'bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_25%,transparent)]',
                'hover:border-[var(--er-border-secondary)] hover:text-[var(--er-text-secondary)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--er-focus-ring)]'
            )}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value} className="bg-[var(--er-surface-dark)]">
                    {option.label}
                </option>
            ))}
        </select>
        <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[var(--er-text-subtle)]"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 10 6"
        >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
    </div>
);

export default Select;
