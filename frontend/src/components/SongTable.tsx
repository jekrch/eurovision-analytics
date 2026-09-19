import React, { useState } from 'react';
import { Song } from '../models/Song';
import { useVideoPip } from './video/VideoPipContext';
import { getYouTubeThumbnailUrl, youtubeWatchUrl } from './video/videoPipShared';


interface SongTableProps {
    songs: Song[];
    className?: string;
}

type SortKey = 'song' | 'artist' | 'country' | 'year' | 'place' | 'points';
type SortDirection = 'asc' | 'desc';

const SongTable: React.FC<SongTableProps> = ({ songs, className = '' }) => {
    const [sortKey, setSortKey] = useState<SortKey>('year');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const { play, activeVideoId } = useVideoPip();

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedSongs = [...songs].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortKey) {
            case 'song':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'artist':
                aValue = a.artist?.name || '';
                bValue = b.artist?.name || '';
                break;
            case 'country':
                aValue = a.country?.name || '';
                bValue = b.country?.name || '';
                break;
            case 'year':
                aValue = a.year?.year || 0;
                bValue = b.year?.year || 0;
                break;
            case 'place':
                aValue = a.finalPlace?.place || 999;
                bValue = b.finalPlace?.place || 999;
                break;
            case 'points':
                aValue = a.totalPoints || 0;
                bValue = b.totalPoints || 0;
                break;
            default:
                return 0;
        }
        
        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    const isPlaying = (song: Song) => !!song.youtubeUrl && song.youtubeUrl === activeVideoId;

    const SortIcon = ({ column }: { column: SortKey }) => {
        const active = sortKey === column;
        return (
            <svg
                className={`w-3 h-3 ms-1.5 transition-transform ${active ? 'text-[var(--er-button-primary)]' : 'opacity-40'} ${active && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                {active ? (
                    <path d="M15.426 12.976H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                ) : (
                    <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                )}
            </svg>
        );
    };

    const sortableColumns: { key: SortKey; label: string }[] = [
        { key: 'song', label: 'Song' },
        { key: 'artist', label: 'Artist' },
        { key: 'country', label: 'Country' },
        { key: 'year', label: 'Year' },
        { key: 'place', label: 'Final Place' },
        { key: 'points', label: 'Total Points' },
    ];

    const headerCell = 'px-6 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-widest';

    const placeBadge = (place?: number) => {
        if (place === 1) return 'bg-[color-mix(in_srgb,var(--er-accent-gold)_20%,transparent)] text-[var(--er-accent-gold)] ring-[color-mix(in_srgb,var(--er-accent-gold)_40%,transparent)]';
        if (place && place <= 3) return 'bg-[color-mix(in_srgb,var(--er-button-primary)_20%,transparent)] text-[var(--er-interactive-primary)] ring-[color-mix(in_srgb,var(--er-button-primary)_40%,transparent)]';
        if (place && place <= 10) return 'bg-[color-mix(in_srgb,var(--er-border-tertiary)_25%,transparent)] text-[var(--er-text-secondary)] ring-[color-mix(in_srgb,var(--er-border-tertiary)_40%,transparent)]';
        return 'bg-white/5 text-[var(--er-text-muted)] ring-white/10';
    };

    return (
        <div className={`overflow-y-auto h-[calc(100vh-350px)] ${className} rounded-xl ring-1 ring-white/10`}>
            <table className="min-w-full">
                <thead className="bg-[var(--er-surface-tertiary)] text-[var(--er-text-tertiary)] sticky top-0 z-10">
                    <tr className="shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
                        <th className={headerCell}>
                            Video
                        </th>
                        {sortableColumns.map(({ key, label }) => (
                            <th
                                key={key}
                                className={`${headerCell} cursor-pointer select-none transition-colors hover:text-[var(--er-text-primary)]`}
                                onClick={() => handleSort(key)}
                            >
                                <div className="flex items-center whitespace-nowrap">
                                    <span>{label}</span>
                                    <SortIcon column={key} />
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-white/5">
                    {sortedSongs.map((song) => (
                        <tr
                            key={song.id}
                            className={`text-sm text-[var(--er-text-secondary)] transition-colors ${
                                isPlaying(song) ? 'bg-[color-mix(in_srgb,var(--er-button-primary)_12%,transparent)]' : 'hover:bg-white/[0.03]'
                            }`}
                        >
                            <td className="px-6 py-3 whitespace-nowrap">
                                {song.youtubeUrl ? (
                                    <a
                                        href={youtubeWatchUrl(song.youtubeUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            // let modifier-clicks open youtube in a new tab as usual
                                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                                            e.preventDefault();
                                            play(song, sortedSongs);
                                        }}
                                        title="Play video"
                                        className="group relative block h-14 w-24"
                                    >
                                        <img
                                            src={getYouTubeThumbnailUrl(song.youtubeUrl) || '/placeholder.png'}
                                            alt={`${song.name} thumbnail`}
                                            className={`h-14 w-24 object-cover rounded-md ring-1 transition-opacity group-hover:opacity-80 ${
                                                isPlaying(song) ? 'ring-2 ring-[var(--er-button-primary)]' : 'ring-white/10'
                                            }`}
                                        />
                                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity ${
                                                isPlaying(song) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}>
                                                <svg className="ml-0.5 h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </span>
                                        </span>
                                    </a>
                                ) : (
                                    <div className="h-14 w-24 bg-white/5 ring-1 ring-white/10 rounded-md flex items-center justify-center text-[var(--er-text-muted)] text-xs">
                                        No video
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap font-medium text-[var(--er-text-primary)]">
                                {song.name}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                                {song.artist?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                                {song.country?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap tabular-nums text-[var(--er-text-tertiary)]">
                                {song.year?.year || 'N/A'}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                                <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold tabular-nums rounded-full ring-1 ring-inset ${placeBadge(song.finalPlace?.place)}`}>
                                    {song.finalPlace?.place || 'N/A'}
                                </span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap tabular-nums">
                                {song.totalPoints || 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SongTable;