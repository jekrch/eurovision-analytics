import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-more';

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

type SortKey = 'song' | 'artist' | 'country' | 'year' | 'place' | 'points';
type SortDirection = 'asc' | 'desc';

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
    const [sortKey, setSortKey] = useState<SortKey>('year');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Earthy color palette for chart elements only
    const chartColors = [
        '#75c8ae', // Mint/Teal
        '#e5771e', // Dark Orange
        '#f4a127', // Light Orange
        '#5a3d2b', // Dark Brown
        '#ffecb4', // Light Cream
        '#8ab5a3', // Lighter teal variant
        '#c9935f', // Mid orange-brown
        '#6d9987', // Darker teal variant
        '#d4a574', // Light brown
        '#4a7c68', // Deep teal
        '#b87333', // Copper
        '#9fc5b8', // Pale teal
        '#cd853f', // Peru
        '#5e8072', // Sage green
        '#daa520', // Goldenrod
    ];

    // Highcharts theme with blue-gray UI styling
    Highcharts.setOptions({
        colors: chartColors,
        chart: {
            backgroundColor: 'transparent',
            style: {
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }
        },
        title: {
            style: {
                color: '#e2e8f0',
                fontSize: '16px',
                fontWeight: '600'
            }
        },
        xAxis: {
            labels: {
                style: {
                    color: '#94a3b8'
                }
            },
            lineColor: '#475569',
            tickColor: '#475569'
        },
        yAxis: {
            labels: {
                style: {
                    color: '#94a3b8'
                }
            },
            title: {
                style: {
                    color: '#94a3b8'
                }
            },
            gridLineColor: '#334155'
        },
        legend: {
            itemStyle: {
                color: '#e2e8f0',
                fontWeight: '400'
            },
            itemHoverStyle: {
                color: '#f1f5f9'
            }
        },
        tooltip: {
            backgroundColor: '#334155',
            borderColor: '#475569',
            borderRadius: 6,
            style: {
                color: '#f1f5f9'
            }
        }
    });

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

    // Sorting function
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedSongs = selectedSongwriter ? [...selectedSongwriter.songDetails].sort((a, b) => {
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
    }) : [];

    // Get top 10 writers by song count
    const topBySongCount = [...songwriters]
        .sort((a: SongwriterStats, b: SongwriterStats) => b.songCount - a.songCount)
        .slice(0, 10);

    // Get top 6 by wins
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
            type: 'bar',
            backgroundColor: 'transparent'
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
                    enabled: true,
                    style: {
                        color: '#e2e8f0',
                        textOutline: '1px #1e293b'
                    }
                },
                cursor: 'pointer',
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(topBySongCount[this.index].name);
                        }
                    }
                },
                colorByPoint: true
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

    // Multi-line chart for placement statistics
    const placementStatsChartOptions: Highcharts.Options = {
        chart: {
            type: 'line',
            backgroundColor: 'transparent'
        },
        title: {
            text: 'Placement Statistics by Songwriter'
        },
        xAxis: {
            categories: topBySongCount.map((w: SongwriterStats) => w.name),
            labels: {
                rotation: -45,
                style: {
                    fontSize: '11px'
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Placement',
                style: {
                    color: chartColors[0]
                }
            },
            reversed: true,
            min: 1,
            max: 30
        }, {
            title: {
                text: 'Number of Songs',
                style: {
                    color: chartColors[4]
                }
            },
            opposite: true
        }],
        tooltip: {
            shared: true
        },
        plotOptions: {
            line: {
                cursor: 'pointer',
                lineWidth: 2,
                point: {
                    events: {
                        click: function(this: any) {
                            const seriesIndex = (this.series as any).index;
                            if (seriesIndex < 3) {
                                handleChartClick(topBySongCount[this.index].name);
                            }
                        }
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Average Place',
            type: 'line',
            data: topBySongCount.map((w: SongwriterStats) => parseFloat(w.avgPlace.toFixed(1))),
            color: chartColors[0],
            marker: {
                symbol: 'circle',
                radius: 5
            }
        }, {
            name: 'Best Place',
            type: 'line',
            data: topBySongCount.map((w: SongwriterStats) => w.bestPlace),
            color: chartColors[1],
            dashStyle: 'ShortDot',
            marker: {
                symbol: 'diamond',
                radius: 5
            }
        }, {
            name: 'Worst Place',
            type: 'line',
            data: topBySongCount.map((w: SongwriterStats) => w.worstPlace),
            color: chartColors[2],
            dashStyle: 'Dash',
            marker: {
                symbol: 'square',
                radius: 4
            }
        }, {
            name: 'Number of Songs',
            type: 'column',
            yAxis: 1,
            data: topBySongCount.map((w: SongwriterStats) => w.songCount),
            color: chartColors[4],
            opacity: 0.3
        }]
    };

    // Bubble chart for avg placement vs songs with visible names
    const avgPlacementBubbleChartOptions: Highcharts.Options = {
        chart: {
            type: 'bubble',
            backgroundColor: 'transparent',
            plotBorderWidth: 1,
            plotBorderColor: '#475569',
            zooming: {
                type: 'xy'
            }
        },
        title: {
            text: 'Average Placement vs Number of Songs'
        },
        xAxis: {
            title: {
                text: 'Number of Songs Written'
            },
            min: 0,
            gridLineWidth: 1
        },
        yAxis: {
            title: {
                text: 'Average Placement (Lower is Better)'
            },
            reversed: true,
            min: 1,
            max: 25,
            gridLineWidth: 1
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            bubble: {
                minSize: 20,
                maxSize: 80,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                    style: {
                        fontSize: '12px',
                        textOutline: '1px #1e293b',
                        color: '#e2e8f0'
                    }
                },
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(this.name);
                        }
                    }
                }
            }
        },
        tooltip: {
            formatter: function(this: any) {
                return `<b>${this.point.name}</b><br/>
                        Songs: ${this.x}<br/>
                        Avg Place: ${this.y.toFixed(1)}<br/>
                        Wins: ${this.point.wins}<br/>
                        <em>Click to see songs</em>`;
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            type: 'bubble',
            data: songwriters.filter((w: SongwriterStats) => w.songCount >= 8).map((w: SongwriterStats, index: number) => ({
                x: w.songCount,
                y: parseFloat(w.avgPlace.toFixed(1)),
                z: w.wins + 1,
                name: w.name,
                wins: w.wins,
                color: w.wins > 0 ? chartColors[1] : chartColors[0]
            }))
        }]
    };

    const winsChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent'
        },
        title: {
            text: 'Top Songwriters by Wins'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y} wins</b><br/>Songs Written: <b>{point.songCount}</b><br/><em>Click to see songs</em>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                innerSize: '30%',
                borderWidth: 0,
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.y} wins',
                    distance: 15,
                    style: {
                        color: '#e2e8f0',
                        textOutline: '1px #1e293b'
                    }
                },
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
            <div className="container pb-10 m-auto max-w-7xl">
                <div className="flex items-center justify-center h-44">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-b-6 border-slate-400"></div>
                </div>
            </div>
        );
    }

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
        <div className="min-h-screen bg-slate-800">
            <div className="container pb-10 m-auto max-w-7xl px-4">
                <div className="mb-8 w-full mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Top songwriters by song count */}
                        <div className="bg-slate-700 rounded-lg shadow-md p-6 border border-slate-700">
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={songCountChartOptions}
                                />
                            </div>
                        </div>

                        {/* Multi-line placement statistics */}
                        <div className="bg-slate-700 rounded-lg shadow-md p-6 border border-slate-700">
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={placementStatsChartOptions}
                                />
                            </div>
                        </div>

                        {/* Avg placement bubble chart */}
                        <div className="bg-slate-700 rounded-lg shadow-md p-6 border border-slate-700">
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={avgPlacementBubbleChartOptions}
                                />
                            </div>
                        </div>

                        {/* Top by wins donut */}
                        <div className="bg-slate-700 rounded-lg shadow-md p-6 border border-slate-700">
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={winsChartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Statistics Summary */}
                    <div className="bg-slate-700 rounded-lg shadow-md p-6 border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-slate-200">Quick Statistics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-600 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-300">Total Songwriters</h3>
                                <p className="text-2xl font-bold text-slate-100">{songwriters.length}</p>
                            </div>
                            <div className="bg-slate-600 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-300">Writers with Wins</h3>
                                <p className="text-2xl font-bold text-slate-100">{songwriters.filter((w: SongwriterStats) => w.wins > 0).length}</p>
                            </div>
                            <div className="bg-slate-600 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-300">Writers with 5+ Songs</h3>
                                <p className="text-2xl font-bold text-slate-100">{songwriters.filter((w: SongwriterStats) => w.songCount >= 5).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Song Details Modal */}
                {showSongTable && (
                    <div 
                        className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${
                            showSongTable ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Backdrop */}
                        <div 
                            className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                                showSongTable ? 'bg-opacity-50' : 'bg-opacity-0'
                            }`}
                            onClick={() => {
                                setShowSongTable(false);
                                setSelectedSongwriter(null);
                            }}
                        />
                        
                        {/* Modal */}
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div 
                                className={`relative w-full max-w-6xl max-h-[90vh] bg-slate-800 shadow-xl transform transition-all duration-300 ${
                                    showSongTable ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col h-full max-h-[90vh] ">
                                    {/* Header */}
                                    <div className="rounded-lg flex items-center justify-between p-6 border-b border-slate-700 bg-slate-700">
                                        <h3 className="text-lg font-semibold text-slate-200">
                                            Songs by {selectedSongwriter?.name}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowSongTable(false);
                                                setSelectedSongwriter(null);
                                            }}
                                            className="rounded-full p-1 hover:bg-slate-600 transition-colors"
                                        >
                                            <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Table Content */}
                                    <div className="flex-1 overflow-auto">
                                        <table className="min-w-full divide-y divide-slate-700">
                                            <thead className="bg-slate-600 sticky top-0">
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

                                    {/* Footer Summary */}
                                    <div className="rounded-b-lg p-6 border-t border-slate-700 bg-slate-700">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-slate-300">Total Songs:</span>
                                                <span className="ml-2 text-slate-100 font-bold">{selectedSongwriter?.songCount}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-300">Wins:</span>
                                                <span className="ml-2 text-slate-100 font-bold">{selectedSongwriter?.wins}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-300">Top 10s:</span>
                                                <span className="ml-2 text-slate-100 font-bold">{selectedSongwriter?.topTens}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-300">Avg Place:</span>
                                                <span className="ml-2 text-slate-100 font-bold">{selectedSongwriter?.avgPlace.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SongwriterHighchartsDashboard;