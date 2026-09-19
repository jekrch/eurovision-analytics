import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames'

interface Country {
  id: string;
  name: string;
}

interface CountryDropdownProps {
  countries: Country[];
  selectedCountry: string;
  onCountryChange: (countryName: string) => void;
  className?: string;
  /** Needed when more than one dropdown is on the page. */
  id?: string;
}

// Styled after eurovision-ranker's Dropdown: a quiet bordered trigger and a
// dark panel that grows out of the trigger's corner.
const CountryDropdown: React.FC<CountryDropdownProps> = ({ countries, selectedCountry, onCountryChange, className, id = 'country-select' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleCountryChange = (countryName: string) => {
    onCountryChange(countryName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={classNames('relative inline-block text-left z-30', className)}>
      <button
        id={id}
        className={classNames(
          'group inline-flex h-[2.25em] min-w-[11rem] items-center justify-between gap-x-1.5',
          'rounded-lg px-3 text-sm font-bold',
          'border text-[var(--er-text-subtle)] shadow-sm',
          'transition-[color,background-color,border-color] ease-out duration-150',
          'hover:border-[var(--er-border-secondary)] hover:text-[var(--er-text-secondary)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--er-focus-ring)]',
          isOpen
            ? 'bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_60%,transparent)] border-[var(--er-border-secondary)] text-[var(--er-text-secondary)]'
            : 'bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_25%,transparent)] border-[var(--er-border-tertiary)] hover:bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_45%,transparent)]'
        )}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedCountry || ' '}</span>
        <svg
          className={classNames('w-2.5 h-2.5 flex-shrink-0 transition-transform duration-200 ease-out', isOpen && 'rotate-180')}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      <div
        role="listbox"
        aria-labelledby={id}
        className={classNames(
          'absolute left-0 top-full mt-1.5 w-full min-w-[11rem] max-h-[19rem] overflow-y-auto p-1',
          'rounded-xl border border-[var(--er-border-tertiary)] bg-[var(--er-surface-dark)]',
          'shadow-[0_14px_36px_-10px_rgba(0,0,0,0.65)] ring-1 ring-black/5',
          'origin-top-left transition duration-150 motion-reduce:transition-none',
          isOpen
            ? 'translate-y-0 scale-100 opacity-100 ease-out'
            : 'pointer-events-none -translate-y-1 scale-95 opacity-0 ease-in'
        )}
      >
        {countries.map((country) => {
          const selected = country.name === selectedCountry;
          return (
            <button
              key={country.name}
              role="option"
              aria-selected={selected}
              tabIndex={isOpen ? 0 : -1}
              className={classNames(
                'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm',
                'transition-colors duration-100',
                'text-[var(--er-text-secondary)] hover:bg-[color-mix(in_srgb,var(--er-surface-light)_30%,transparent)] hover:text-[var(--er-interactive-text-light)]',
                'focus:outline-none focus-visible:bg-[color-mix(in_srgb,var(--er-surface-light)_30%,transparent)]'
              )}
              onClick={() => handleCountryChange(country.name)}
            >
              <svg
                className={classNames('h-3 w-3 flex-shrink-0 text-[var(--er-accent-blue)]', selected ? 'opacity-100' : 'opacity-0')}
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path d="m2 6.5 2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="truncate">{country.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CountryDropdown;
