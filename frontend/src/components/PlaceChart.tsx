import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartOptions, PointElement, Tick, registerables } from 'chart.js';
import CountryDropdown from './CountryDropdown';
import SongTable from './SongTable';
import LineChart from './Chart';
import { songTooltipHandler } from '../utils/TooltipUtils';
import { Country } from '../models/Country';
import Header from './Header';
import { Song } from '../models/Song';

Chart.register(...registerables);

const PlaceChart: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('Croatia');
    const [songs, setSongs] = useState<Song[]>([]);

    const years = Array.from(new Set(songs.map((song) => song.year.year))).sort((a, b) => a - b);
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    useEffect(() => {
        const fetchCountries = async () => {
            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            countries(where: {
                                songs: {
                                    finalPlace: {
                                        place_GT: 0
                                    }
                                }
                            }, options: {
                                sort: [{
                                    name: ASC
                                }]
                            }) {
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
                                    youtubeUrl
                                    totalPoints
                                    finalPlace {
                                        place
                                    }
                                    country {
                                        name
                                    }
                                    year {
                                        year
                                    }
                                    artist {
                                        name
                                    }
                            }
                        }
                    `,
                }),
            });
            const data = await response.json();
            const sortedSongs = data.data.songs.sort((a: Song, b: Song) => a.year?.year! - b.year?.year!);
            setSongs(sortedSongs);
        };

        if (selectedCountry) {
            fetchSongs();
        }
    }, [selectedCountry]);

    // Consistent color palette for a dark theme
    const colors = {
        background: 'rgb(30, 41, 59)',      // slate-800
        text: 'rgb(203, 213, 225)',         // slate-300
        line: 'rgb(100, 116, 139)',         // slate-500
        point: 'rgb(226, 232, 240)',        // slate-200
        grid: 'rgb(51, 65, 85)',            // slate-700
        firstPlace: '#FBBF24',              // amber-400 (a nice gold for winners)
    };

    const chartData = {
        labels: Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
        datasets: [
            {
                label: 'Final Place',
                data: Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                    const year = minYear + i;
                    const song = songs.find((song) => song.year.year! === year);
                    return song ? song.finalPlace!.place! : null;
                }),
                meta: Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                    const year = minYear + i;
                    const song = songs.find((song) => song.year.year! === year);
                    return song || null;
                }),
                fill: false,
                borderColor: colors.line,
                tension: 0.1,
                spanGaps: true,
                pointHitRadius: 20,
                pointRadius: (context: any) => {
                    const place = context.parsed?.y;
                    if (place === null || place === undefined) return 0;
                    return place === 1 ? 8 : 4; // Make 1st place points larger
                },
                pointHoverRadius: 10,
                pointBackgroundColor: (context: any) => {
                    const place = context.parsed?.y;
                    return place === 1 ? colors.firstPlace : colors.point;
                },
                pointBorderColor: (context: any) => {
                    const place = context.parsed?.y;
                    return place === 1 ? colors.firstPlace : colors.point;
                },
                pointStyle: (context: any) => {
                    const place = context.parsed?.y;
                    return place === 1 ? 'star' : 'circle'; // Use a star for 1st place
                },
            },
        ],
    };
    
    const chartOptions: ChartOptions = {
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: false,
                position: 'nearest',
                external: songTooltipHandler
            },
            legend: {
                labels: {
                    color: colors.text, // Style legend text
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Year',
                    color: colors.text,
                },
                grid: {
                    color: colors.grid,
                },
                ticks: {
                    color: colors.text,
                },
            },
            y: {
                reverse: true,
                min: -2,
                max: songs.length > 0 ? Math.max(...songs.map((song) => song.finalPlace.place + 2)) : 10,
                ticks: {
                    color: colors.text,
                    stepSize: 7,
                    callback: (value: number | string) => {
                        if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
                            return `${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'}`;
                        }
                        return '';
                    },
                },
                afterBuildTicks: (scale) => {
                    const ticks = scale.ticks.filter((t: Tick) => t.value > 0);
                    if (scale.axis !== 'y') return;
                    if (ticks.length > 0) {
                        ticks.reverse();
                        if (ticks[0].value !== 1) {
                            ticks.unshift({ value: 1, label: '1st' });
                        }
                        if (ticks.length > 1 && ticks[1].value === 1) {
                             ticks.splice(1, 1);
                        }
                    }
                    scale.ticks = ticks;
                },
                grid: {
                    color: colors.grid,
                },
                title: {
                    display: true,
                    text: 'Final Place',
                    color: colors.text,
                },
            },
        },
    };

    return (
        <div className="container marker:mt-4 mb-8 m-auto">
            <div className="mb-4 mt-6 flex items-center justify-center">
                <CountryDropdown
                    className="mb-4 absolute mt-14"
                    countries={countries}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                />
            </div>
            
            <div className="max-w-[90vw] m-auto mt-[4em] p-4 bg-slate-600 rounded-lg shadow-lg">
                <LineChart data={chartData} options={chartOptions} />
            </div>

            <div className="max-w-[90vw] m-auto  relative overflow-x-auto shadow-md sm:rounded-lg mt-8">
                <SongTable songs={songs} className="max-h-[50em]" />
            </div>
        </div>
    );
};

export default PlaceChart;