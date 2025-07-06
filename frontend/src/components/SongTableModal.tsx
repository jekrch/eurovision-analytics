import React from 'react';
import SongTable from './SongTable';
import { Song } from '../models/Song';
import Modal from './Modal';


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
    const footer = summaryStats && summaryStats.length > 0 ? (
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(summaryStats.length, 4)} gap-1 text-sm`}>
            {summaryStats.map((stat, index) => (
                <div key={index}>
                    <span className="font-semibold text-slate-300">{stat.label}:</span>
                    <span className="ml-2 text-slate-100 font-bold">{stat.value}</span>
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