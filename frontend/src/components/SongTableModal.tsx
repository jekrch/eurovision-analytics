import React from 'react';
import SongTable from './SongTable';
import { Song } from '../models/Song';
import Modal from './Modal';
import { eyebrow } from '../theme';


interface SongTableModalProps {
    title?: string;
    songs?: Song[];
    isOpen: boolean;
    onClose: () => void;
    summaryStats?: {
        label: string;
        value?: string | number;
    }[];
}

const SongTableModal: React.FC<SongTableModalProps> = ({ 
    title, 
    songs, 
    isOpen, 
    onClose, 
    summaryStats 
}) => {
    // Create footer content from summary stats
    // spelled out so Tailwind can find the class names when it scans this file
    const columnClasses = ['md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4'];

    const footer = summaryStats && summaryStats.length > 0 ? (
        <div className={`grid grid-cols-2 ${columnClasses[Math.min(summaryStats.length, 4) - 1]} gap-4`}>
            {summaryStats.map((stat, index) => (
                <div key={index}>
                    <p className={eyebrow}>{stat.label}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--er-text-primary)]">{stat.value}</p>
                </div>
            ))}
        </div>
    ) : undefined;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
        >
            <SongTable songs={songs ?? []} />
        </Modal>
    );
};

export default SongTableModal;