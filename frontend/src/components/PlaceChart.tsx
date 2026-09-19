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
import { card, colors as theme, eyebrow } from '../theme';

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

    const colors = {
        text: theme.textMuted,
        line: theme.copper,
        point: theme.textPrimary,
        grid: theme.grid,
        firstPlace: theme.gold,
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
                borderWidth: 2,
                tension: 0.25,
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
                display: false,
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                        <p className={eyebrow}>Country</p>
                        <CountryDropdown
                            className="mt-1.5"
                            countries={countries}
                            selectedCountry={selectedCountry}
                            onCountryChange={setSelectedCountry}
                        />
                    </div>
                    <p className="text-xs text-[var(--er-text-muted)]">
                        <span className="text-[var(--er-accent-gold)]">★</span> marks a win
                    </p>
                </div>
                <LineChart data={chartData} options={chartOptions} />
            </div>

            <div className="mt-6">
                <SongTable songs={songs} className="max-h-[50em] bg-[var(--er-card-surface)]" />
            </div>
        </div>
    );
};

export default PlaceChart;