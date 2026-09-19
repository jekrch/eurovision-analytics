import React from 'react';
import { eyebrow } from '../theme';

interface StatTileProps {
    label: string;
    value: React.ReactNode;
}

const StatTile: React.FC<StatTileProps> = ({ label, value }) => {
    return (
        <div className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10 p-4">
            <p className={eyebrow}>{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--er-text-primary)]">{value}</p>
        </div>
    );
};

export default StatTile;
