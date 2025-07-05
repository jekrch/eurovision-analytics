import React, { useState } from 'react';
import { Song } from '../models/Song';


interface SongTableProps {
    songs: Song[];
    className?: string;
}

type SortKey = 'song' | 'artist' | 'country' | 'year' | 'place' | 'points';
type SortDirection = 'asc' | 'desc';

const getYouTubeThumbnailUrl = (videoId: string | null): string | null => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const SongTable: React.FC<SongTableProps> = ({ songs, className = '' }) => {
    const [sortKey, setSortKey] = useState<SortKey>('year');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) {
            return (
                <svg className="w-3 h-3 ms-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                </svg>
            );
        }
        return (
            <svg className={`w-3 h-3 ms-1.5 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
            </svg>
        );
    };

    return (
        <div className={`overflow-auto ${className}`}>
            <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-600 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Thumbnail
                        </th>
                        <th 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 ${
                                sortKey === 'song' ? 'font-bold' : ''
                            }`}
                            onClick={() => handleSort('song')}
                        >
                            <div className="flex items-center">
                                <span>Song</span>
                                <SortIcon column="song" />
                            </div>
                        </th>
                        <th 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 ${
                                sortKey === 'artist' ? 'font-bold' : ''
                            }`}
                            onClick={() => handleSort('artist')}
                        >
                            <div className="flex items-center">
                                <span>Artist</span>
                                <SortIcon column="artist" />
                            </div>
                        </th>
                        <th 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 ${
                                sortKey === 'country' ? 'font-bold' : ''
                            }`}
                            onClick={() => handleSort('country')}
                        >
                            <div className="flex items-center">
                                <span>Country</span>
                                <SortIcon column="country" />
                            </div>
                        </th>
                        <th 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 ${
                                sortKey === 'year' ? 'font-bold' : ''
                            }`}
                            onClick={() => handleSort('year')}
                        >
                            <div className="flex items-center">
                                <span>Year</span>
                                <SortIcon column="year" />
                            </div>
                        </th>
                        <th 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 ${
                                sortKey === 'place' ? 'font-bold' : ''
                            }`}
                            onClick={() => handleSort('place')}
                        >
                            <div className="flex items-center">
                                <span>Final Place</span>
                                <SortIcon column="place" />
                            </div>
                        </th>
                        <th 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 ${
                                sortKey === 'points' ? 'font-bold' : ''
                            }`}
                            onClick={() => handleSort('points')}
                        >
                            <div className="flex items-center">
                                <span>Total Points</span>
                                <SortIcon column="points" />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-400">
                    {sortedSongs.map((song, index) => (
                        <tr key={song.id} className={`${index % 2 === 0 ? 'bg-slate-500' : 'bg-slate-500/80'} text-white font-medium`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {song.youtubeUrl ? (
                                    <a
                                        href={`https://www.youtube.com/watch?v=${song.youtubeUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={getYouTubeThumbnailUrl(song.youtubeUrl) || '/placeholder.png'}
                                            alt={`${song.name} thumbnail`}
                                            className="h-16 w-24 object-cover rounded hover:opacity-80 transition-opacity"
                                        />
                                    </a>
                                ) : (
                                    <div className="h-16 w-24 bg-slate-600 rounded flex items-center justify-center text-gray-400 text-xs">
                                        No video
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium">{song.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{song.artist?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{song.country?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{song.year?.year || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${song.finalPlace?.place === 1 ? 'bg-yellow-600 text-white' : 
                                      song.finalPlace?.place && song.finalPlace.place <= 3 ? 'bg-green-700 text-white' :
                                      song.finalPlace?.place && song.finalPlace.place <= 10 ? 'bg-blue-700 text-white' :
                                      'bg-gray-600 text-gray-200'}`}>
                                    {song.finalPlace?.place || 'N/A'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{song.totalPoints || 'N/A'}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SongTable;