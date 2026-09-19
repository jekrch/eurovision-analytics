import React from 'react';

interface YearRangeSliderProps {
    min: number;
    max: number;
    from: number;
    to: number;
    onChange: (from: number, to: number) => void;
    className?: string;
}

/** A from/to year slider built from two stacked range inputs (styled in index.css). */
const YearRangeSlider: React.FC<YearRangeSliderProps> = ({ min, max, from, to, onChange, className }) => {
    const span = Math.max(max - min, 1);
    const left = ((from - min) / span) * 100;
    const right = ((to - min) / span) * 100;

    return (
        <div className={className}>
            <div className="flex justify-between text-xs tabular-nums text-[var(--er-text-secondary)] mb-1">
                <span>{from}</span>
                <span>{to}</span>
            </div>
            <div className="range-dual relative h-4 min-w-[12rem]">
                <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1 rounded-full bg-white/10" />
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--er-interactive-primary)]"
                    style={{ left: `${left}%`, width: `${right - left}%` }}
                />
                <input
                    type="range"
                    aria-label="From year"
                    min={min}
                    max={max}
                    value={from}
                    onChange={(e) => onChange(Math.min(Number(e.target.value), to), to)}
                />
                <input
                    type="range"
                    aria-label="To year"
                    min={min}
                    max={max}
                    value={to}
                    onChange={(e) => onChange(from, Math.max(Number(e.target.value), from))}
                />
            </div>
        </div>
    );
};

export default YearRangeSlider;
