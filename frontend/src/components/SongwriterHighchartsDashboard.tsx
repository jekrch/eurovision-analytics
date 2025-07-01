import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

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
}

const SongwriterHighchartsDashboard: React.FC = () => {
    const [songwriters, setSongwriters] = useState<SongwriterStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                                    name
                                    finalPlace {
                                        place
                                    }
                                    country {
                                        name
                                    }
                                    year {
                                        year
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
                            countries: Array.from(uniqueCountries)
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
        .slice(0, 3);

    // Chart configurations
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
                        Top 10s: ${writer.topTens}`;
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                },
                color: '#3B82F6'
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
                        Worst Place: ${writer.worstPlace}`;
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                color: '#10B981'
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
                    pointFormat: 'Songs: {point.x}<br>Best Place: {point.y}'
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
            text: 'Top 3 Songwriters by Wins'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y} wins</b><br/>Songs Written: <b>{point.songCount}</b>'
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
                colors: ['#FFD700', '#C0C0C0', '#CD7F32'] // Gold, Silver, Bronze
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
        </div>
    );
};

export default SongwriterHighchartsDashboard;