import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface Song {
    id: string;
    name: string;
    youtubeUrl: string | null;
    finalPlace?: {
        place: number;
    };
    country?: {
        name: string;
    };
    year?: {
        year: number;
    };
    artist?: {
        name: string;
    };
    totalPoints?: number;
}

interface SongwriterStats {
    name: string;
    songCount: number;
    avgPlace: number;
    bestPlace: number;
    worstPlace: number;
    wins: number;
    topTens: number;
    songs: string[];
    countries: string[];
    songDetails: Song[];
}

// YouTube thumbnail utility functions
const getYouTubeThumbnailUrl = (videoId: string | null): string | null => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const SongwriterHighchartsDashboard: React.FC = () => {
    const [songwriters, setSongwriters] = useState<SongwriterStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSongwriter, setSelectedSongwriter] = useState<SongwriterStats | null>(null);
    const [showSongTable, setShowSongTable] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            songwriters {
                                name
                                songs {
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
                        }
                    `,
                }),
            });

            const result = await response.json();
            
            if (result.data && result.data.songwriters) {
                // Process songwriter data
                const writerStats: SongwriterStats[] = result.data.songwriters
                    .map((writer: any) => {
                        const songsWithPlacement = writer.songs.filter((s: any) => s.finalPlace);
                        const places = songsWithPlacement.map((s: any) => s.finalPlace.place);
                        
                        if (places.length === 0) return null;
                        
                        const uniqueCountries = new Set(songsWithPlacement
                            .filter((s: any) => s.country)
                            .map((s: any) => s.country.name));
                        
                        return {
                            name: writer.name,
                            songCount: songsWithPlacement.length,
                            avgPlace: places.reduce((a: number, b: number) => a + b, 0) / places.length,
                            bestPlace: Math.min(...places),
                            worstPlace: Math.max(...places),
                            wins: places.filter((p: number) => p === 1).length,
                            topTens: places.filter((p: number) => p <= 10).length,
                            songs: songsWithPlacement.map((s: any) => `${s.name} (${s.year?.year || 'N/A'})`),
                            countries: Array.from(uniqueCountries),
                            songDetails: songsWithPlacement
                        };
                    })
                    .filter((w: SongwriterStats | null) => w !== null)
                    .filter((w: SongwriterStats) => w.songCount >= 1);

                setSongwriters(writerStats);
            }

            setIsLoading(false);
        };

        fetchData();
    }, []);

    // Get top 10 writers by song count
    const topBySongCount = [...songwriters]
        .sort((a: SongwriterStats, b: SongwriterStats) => b.songCount - a.songCount)
        .slice(0, 10);

    // Get top 3 by wins
    const topByWins = [...songwriters]
        .filter((w: SongwriterStats) => w.wins > 0)
        .sort((a: SongwriterStats, b: SongwriterStats) => b.wins - a.wins)
        .slice(0, 6);

    // Click handler for charts
    const handleChartClick = (songwriterName: string) => {
        const writer = songwriters.find(w => w.name === songwriterName);
        if (writer) {
            setSelectedSongwriter(writer);
            setShowSongTable(true);
        }
    };

    // Chart configurations with click handlers
    const songCountChartOptions: Highcharts.Options = {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Top 10 Songwriters by Number of Songs'
        },
        xAxis: {
            categories: topBySongCount.map((w: SongwriterStats) => w.name),
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of Songs',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        tooltip: {
            formatter: function(this: any) {
                const writer = topBySongCount[this.point.index];
                return `<b>${writer.name}</b><br/>
                        Songs: ${writer.songCount}<br/>
                        Countries: ${writer.countries.join(', ')}<br/>
                        Top 10s: ${writer.topTens}<br/>
                        <em>Click to see songs</em>`;
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                },
                color: '#3B82F6',
                cursor: 'pointer',
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(topBySongCount[this.index].name);
                        }
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Songs Written',
            type: 'bar',
            data: topBySongCount.map((w: SongwriterStats) => w.songCount)
        }]
    };

    const avgPlaceChartOptions: Highcharts.Options = {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Average Final Placement (Lower is Better)'
        },
        xAxis: {
            categories: topBySongCount.map((w: SongwriterStats) => w.name),
            crosshair: true,
            labels: {
                rotation: -45,
                style: {
                    fontSize: '11px'
                }
            }
        },
        yAxis: {
            min: 0,
            reversed: true,
            title: {
                text: 'Average Placement'
            }
        },
        tooltip: {
            formatter: function(this: any) {
                const writer = topBySongCount[this.point.index];
                return `<b>${writer.name}</b><br/>
                        Average Place: ${writer.avgPlace.toFixed(1)}<br/>
                        Best Place: ${writer.bestPlace}<br/>
                        Worst Place: ${writer.worstPlace}<br/>
                        <em>Click to see songs</em>`;
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                color: '#10B981',
                cursor: 'pointer',
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(topBySongCount[this.index].name);
                        }
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Average Placement',
            type: 'column',
            data: topBySongCount.map((w: SongwriterStats) => parseFloat(w.avgPlace.toFixed(1)))
        }]
    };

    const bestPlaceChartOptions: Highcharts.Options = {
        chart: {
            type: 'scatter',
            zooming: {
                type: 'xy'      
            }
        },
        title: {
            text: 'Best Placement vs Number of Songs'
        },
        xAxis: {
            title: {
                text: 'Number of Songs Written'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: 'Best Placement (Lower is Better)'
            },
            reversed: true,
            min: 0,
            max: 26
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        enabled: true,
                    }
                },
                tooltip: {
                    headerFormat: '<b>{point.key}</b><br>',
                    pointFormat: 'Songs: {point.x}<br>Best Place: {point.y}<br><em>Click to see songs</em>'
                },
                cursor: 'pointer',
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(this.name);
                        }
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Songwriters',
            color: 'rgba(223, 83, 83, .5)',
            data: topBySongCount.map((w: SongwriterStats) => ({
                x: w.songCount,
                y: w.bestPlace,
                name: w.name
            }))
        } as any]
    };

    const winsChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Top 5 Songwriters by Wins'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y} wins</b><br/>Songs Written: <b>{point.songCount}</b><br/><em>Click to see songs</em>'
        },
        accessibility: {
            point: {
                valueSuffix: ' wins'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.y} wins'
                },
                colors: ['#FFD700', '#C0C0C0', '#CD7F32'], // Gold, Silver, Bronze
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(this.name);
                        }
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Wins',
            colorByPoint: true,
            data: topByWins.map((w: SongwriterStats, index: number) => ({
                name: w.name,
                y: w.wins,
                songCount: w.songCount,
                sliced: index === 0,
                selected: index === 0
            }))
        }] as any
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-b-6 border-gray-800"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl px-5 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">Eurovision Songwriter Statistics Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top songwriters by song count */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={songCountChartOptions}
                    />
                </div>

                {/* Average placement */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={avgPlaceChartOptions}
                    />
                </div>

                {/* Best placement scatter */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={bestPlaceChartOptions}
                    />
                </div>

                {/* Top 3 by wins */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={winsChartOptions}
                    />
                </div>
            </div>

            {/* Statistics Summary */}
            <div className="bg-gray-100 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Quick Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded p-4">
                        <h3 className="font-semibold text-gray-600">Total Songwriters</h3>
                        <p className="text-2xl font-bold">{songwriters.length}</p>
                    </div>
                    <div className="bg-white rounded p-4">
                        <h3 className="font-semibold text-gray-600">Writers with Wins</h3>
                        <p className="text-2xl font-bold">{songwriters.filter((w: SongwriterStats) => w.wins > 0).length}</p>
                    </div>
                    <div className="bg-white rounded p-4">
                        <h3 className="font-semibold text-gray-600">Writers with 5+ Songs</h3>
                        <p className="text-2xl font-bold">{songwriters.filter((w: SongwriterStats) => w.songCount >= 5).length}</p>
                    </div>
                </div>
            </div>

            {/* Song Details Modal/Table */}
            {showSongTable && selectedSongwriter && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Songs by {selectedSongwriter.name}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSongTable(false);
                                        setSelectedSongwriter(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Songs Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thumbnail
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Song
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Artist
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Country
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Year
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Place
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Points
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedSongwriter.songDetails
                                            .sort((a, b) => (b.year?.year || 0) - (a.year?.year || 0))
                                            .map((song) => (
                                                <tr key={song.id} className="hover:bg-gray-50">
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
                                                            <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                                                No video
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{song.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{song.artist?.name || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{song.country?.name || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{song.year?.year || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${song.finalPlace?.place === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                                              song.finalPlace?.place && song.finalPlace.place <= 3 ? 'bg-green-100 text-green-800' :
                                                              song.finalPlace?.place && song.finalPlace.place <= 10 ? 'bg-blue-100 text-blue-800' :
                                                              'bg-gray-100 text-gray-800'}`}>
                                                            {song.finalPlace?.place || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{song.totalPoints || 'N/A'}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Stats */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold">Total Songs:</span> {selectedSongwriter.songCount}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Wins:</span> {selectedSongwriter.wins}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Top 10s:</span> {selectedSongwriter.topTens}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Avg Place:</span> {selectedSongwriter.avgPlace.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SongwriterHighchartsDashboard;