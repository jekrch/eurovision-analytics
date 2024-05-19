import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import CountryDropdown from './CountryDropdown';
import SongTable from './SongTable';

Chart.register(...registerables);

interface Song {
    id: string;
    name: string;
    year: { year: number };
    artist: { name: string };
    finalPlace: { place: number };
    totalPoints: number;
}

interface Country {
    id: string;
    name: string;
}

const PlaceChart: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('Croatia');
    const [songs, setSongs] = useState<Song[]>([]);
    const [sortedSongs, setSortedSongs] = useState<Song[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Song; direction: 'asc' | 'desc' }>({
        key: 'year',
        direction: 'asc',
    });

    useEffect(() => {
        const fetchCountries = async () => {
            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
          query {
            countries(options: { sort: [{ name: ASC }] }) {
              name
            }
          }
          `,
                }),
            });
            const data = await response.json();
            setCountries(data.data.countries);
            setSelectedCountry(data.data.countries[0]?.name || '');
        };

        fetchCountries();
    }, []);

    useEffect(() => {
        const fetchSongs = async () => {
            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            songs(where: { country: { name: "${selectedCountry}" }, finalPlace: { place_NOT: null } }) {
                                id
                                name
                                year { year }
                                artist { name }
                                finalPlace { place }
                                totalPoints
                            }
                        }
                    `,
                }),
            });
            const data = await response.json();
            const sortedSongs = data.data.songs.sort((a: Song, b: Song) => b.year.year - a.year.year);
            setSongs(sortedSongs);
            setSortedSongs(sortedSongs);
        };

        if (selectedCountry) {
            fetchSongs();
        }
    }, [selectedCountry]);

    const handleSort = (key: keyof Song) => {
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

    const chartData = {
        labels: songs.map((song) => song.year.year),
        datasets: [
            {
                label: 'Final Place',
                data: songs.map((song) => song.finalPlace.place),
                fill: false,
                borderColor: 'rgb(118 163 184)',
                tension: 0.1,
            },
        ],
    };

    const options = {
        maintainAspectRatio: false,
        scales: {
            y: {
                reverse: true,
                min: 1,
                max: Math.max(...songs.map((song) => song.finalPlace.place), 1),
                ticks: {
                    callback: (value: number) =>
                        `${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'}`,
                },
            },
        },
    };


    const [isOpen, setIsOpen] = useState(false);

    const handleCountryChange = (countryName: string) => {
        setSelectedCountry(countryName);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };


    return (
        <div className="container pb-20 mb-0">
            <h1 className="text-lg font-bold my-3 text-center text-gray-500">Grand Final Results By Country</h1>

            <div className="mb-4 flex items-center justify-center relative">
                <CountryDropdown
                    className="mb-4"
                    countries={countries}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                />
            </div>

            <div className="mb-8">
                <Line className="min-h-350 h-[15em]" data={chartData} options={options as any} />
            </div>

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">

                <SongTable
                    songs={sortedSongs}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            </div>
        </div>
    );
};

export default PlaceChart;