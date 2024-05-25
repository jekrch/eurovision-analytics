import React, { useEffect, useState } from 'react';

interface Song {
  id: string;
  name: string;
  year: { year: number };
  artist: { name: string };
  finalPlace: { place: number };
  totalPoints: number;
}

interface SortConfig {
  key: keyof Song;
  direction: 'asc' | 'desc';
}

interface SongTableProps {
  songs: Song[];
}

const SongTable: React.FC<SongTableProps> = ({ songs }) => {
  
  const [sortedSongs, setSortedSongs] = useState<Song[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Song; direction: 'asc' | 'desc' }>({
      key: 'year',
      direction: 'asc',
  });
  
  const onSort = (key: keyof Song) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const sortedData = [...songs].sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];

        if (typeof valueA === 'object' && typeof valueB === 'object') {
            const nestedValueA = Object.values(valueA)[0];
            const nestedValueB = Object.values(valueB)[0];

            if (nestedValueA < nestedValueB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (nestedValueA > nestedValueB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        } else {
            if (valueA < valueB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        }

        return 0;
    });
    setSortedSongs(sortedData);
  }, [songs, sortConfig]);

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg shadow-md">
      <table className="w-full text-sm text-left rtl:text-right text-gray-300">
        <thead className="text-md text-gray-300 bg-slate-600">
          <tr>
            <th
              scope="col"
              className={`px-6 py-3 cursor-pointer ${
                sortConfig.key === 'year' ? 'font-bold' : ''
              }`}
              onClick={() => onSort('year')}
            >
              <div className="flex items-center">
                Year
                <svg
                  className={`w-3 h-3 ms-1.5 ${
                    sortConfig.key === 'year' && sortConfig.direction === 'asc'
                      ? 'rotate-180'
                      : ''
                  }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                </svg>
              </div>
            </th>
            <th
              scope="col"
              className={`px-6 py-3 cursor-pointer ${
                sortConfig.key === 'name' ? 'font-bold' : ''
              }`}
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Song
                <svg
                  className={`w-3 h-3 ms-1.5 ${
                    sortConfig.key === 'name' && sortConfig.direction === 'asc'
                      ? 'rotate-180'
                      : ''
                  }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                </svg>
              </div>
            </th>
            <th
              scope="col"
              className={`px-6 py-3 cursor-pointer ${
                sortConfig.key === 'artist' ? 'font-bold' : ''
              }`}
              onClick={() => onSort('artist')}
            >
              <div className="flex items-center">
                Artist
                <svg
                  className={`w-3 h-3 ms-1.5 ${
                    sortConfig.key === 'artist' && sortConfig.direction === 'asc'
                      ? 'rotate-180'
                      : ''
                  }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                </svg>
              </div>
            </th>
            <th
              scope="col"
              className={`px-6 py-3 cursor-pointer ${
                sortConfig.key === 'finalPlace' ? 'font-bold' : ''
              }`}
              onClick={() => onSort('finalPlace')}
            >
              <div className="flex items-center">
                Final Place
                <svg
                  className={`w-3 h-3 ms-1.5 ${
                    sortConfig.key === 'finalPlace' && sortConfig.direction === 'asc'
                      ? 'rotate-180'
                      : ''
                  }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                </svg>
              </div>
            </th>
            <th
              scope="col"
              className={`px-6 py-3 cursor-pointer ${
                sortConfig.key === 'totalPoints' ? 'font-bold' : ''
              }`}
              onClick={() => onSort('totalPoints')}
            >
              <div className="flex items-center">
                Total Points
                <svg
                  className={`w-3 h-3 ms-1.5 ${
                    sortConfig.key === 'totalPoints' && sortConfig.direction === 'asc'
                      ? 'rotate-180'
                      : ''
                  }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSongs.map((song, index) => (
            <tr key={song.id} className={`border-b border-b-stone-400 text-white font-medium ${index % 2 === 0 ? 'bg-[#909fb3]' : 'bg-[#828fa2]'}`}>
              <td className="px-6 py-4">{song.year.year}</td>
              <td className="px-6 py-4">{song.name}</td>
              <td className="px-6 py-4">{song.artist.name}</td>
              <td className="px-6 py-4">{song.finalPlace.place}</td>
              <td className="px-6 py-4">{song.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SongTable;