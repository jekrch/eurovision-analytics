import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-more';
import { applyHighchartsTheme, card, chartColors, colors, spinner } from '../theme';
import SongTableModal from './SongTableModal';
import StatTile from './StatTile';
import { Song } from '../models/Song';
import classNames from 'classnames';

interface LanguageData {
    name: string;
    count: number;
    avgPlace: number;
    bestPlace: number;
    worstPlace: number;
    wins: number;
    topTens: number;
    songs: Song[];
    yearlyCounts: { [year: number]: number };
}

applyHighchartsTheme();

const LanguageDashboard: React.FC = () => {
    const [data, setData] = useState<LanguageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageData | null>(null);
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
                            languages {
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

            const languageData = result.data.languages.map((language: any) => {
                const songsWithPlacement = language.songs.filter((s: any) => s.finalPlace);
                const places = songsWithPlacement.map((s: any) => s.finalPlace.place);
                
                // Calculate yearly counts
                const yearlyCounts: { [year: number]: number } = {};
                songsWithPlacement.forEach((song: any) => {
                    if (song.year?.year) {
                        yearlyCounts[song.year.year] = (yearlyCounts[song.year.year] || 0) + 1;
                    }
                });

                return {
                    name: language.name,
                    count: language.songs.length,
                    avgPlace: places.length > 0 
                        ? places.reduce((a: number, b: number) => a + b, 0) / places.length 
                        : 0,
                    bestPlace: places.length > 0 ? Math.min(...places) : 0,
                    worstPlace: places.length > 0 ? Math.max(...places) : 0,
                    wins: places.filter((p: number) => p === 1).length,
                    topTens: places.filter((p: number) => p <= 10).length,
                    songs: songsWithPlacement,
                    yearlyCounts
                };
            });

            // Sort by count descending
            const sortedLanguageData = languageData.sort((a: any, b: any) => b.count - a.count);

            setData(sortedLanguageData);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    // Get top languages
    const topLanguages = data.slice(0, 10);
    const topByWins = data.filter(l => l.wins > 0).sort((a, b) => b.wins - a.wins).slice(0, 6);

    // Prepare data for yearly trends
    const allYears = new Set<number>();
    data.forEach(lang => {
        Object.keys(lang.yearlyCounts).forEach(year => {
            allYears.add(parseInt(year));
        });
    });
    const yearsSorted = Array.from(allYears).sort();

    // Click handler for charts
    const handleChartClick = (languageName: string) => {
        const language = data.find(l => l.name === languageName);
        if (language) {
            setSelectedLanguage(language);
            setShowSongTable(true);
        }
    };

    // Donut chart configuration
    const donutChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent'
        },
        title: {
            text: 'Eurovision Songs by Language'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y} songs ({point.percentage:.1f}%)</b><br/>Avg Place: <b>{point.avgPlace:.1f}</b><br/><em>Click to see songs</em>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                innerSize: '30%',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.y}',
                    distance: 15,
                    style: {
                        color: colors.textPrimary,
                        textOutline: `1px ${colors.surfacePrimary}`,
                        fontSize: '11px'
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
            name: 'Songs',
            colorByPoint: true,
            data: topLanguages.map((item, index) => ({
                name: item.name,
                y: item.count,
                avgPlace: item.avgPlace,
                sliced: index === 0,
                selected: index === 0
            }))
        }] as any
    };

    // Bar chart configuration
    const barChartOptions: Highcharts.Options = {
        chart: {
            type: 'bar',
            backgroundColor: 'transparent'
        },
        title: {
            text: 'Top Languages by Performance Metrics'
        },
        xAxis: {
            categories: topLanguages.map(l => l.name),
            title: { text: null }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Count',
                align: 'high'
            }
        },
        tooltip: {
            shared: true,
            formatter: function(this: any) {
                const langIndex = this.points[0].point.index;
                const lang = topLanguages[langIndex];
                return `<b>${lang.name}</b><br/>
                        Total Songs: ${lang.count}<br/>
                        Wins: ${lang.wins}<br/>
                        Top 10s: ${lang.topTens}<br/>
                        <em>Click to see songs</em>`;
            }
        },
        plotOptions: {
            bar: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function(this: any) {
                            handleChartClick(topLanguages[this.index].name);
                        }
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Total Songs',
            type: 'bar',
            data: topLanguages.map(l => l.count),
            color: chartColors[0]
        }, {
            name: 'Top 10 Finishes',
            type: 'bar',
            data: topLanguages.map(l => l.topTens),
            color: chartColors[1]
        }, {
            name: 'Wins',
            type: 'bar',
            data: topLanguages.map(l => l.wins),
            color: chartColors[2]
        }]
    };

    // Bubble chart for avg placement vs songs
    const bubbleChartOptions: Highcharts.Options = {
        chart: {
            type: 'bubble',
            backgroundColor: 'transparent',
            plotBorderWidth: 1,
            plotBorderColor: colors.axisLine,
            zooming: {
                type: 'xy'
            }
        },
        title: {
            text: 'Average Placement vs Number of Songs by Language'
        },
        xAxis: {
            title: {
                text: 'Number of Songs'
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
                        fontSize: '11px',
                        textOutline: `1px ${colors.surfacePrimary}`,
                        color: colors.textPrimary
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
                        Top 10s: ${this.point.topTens}<br/>
                        <em>Click to see songs</em>`;
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            type: 'bubble',
            data: data.filter(l => l.count >= 45 && l.avgPlace > 0).map((l, index) => ({
                x: l.count,
                y: parseFloat(l.avgPlace.toFixed(1)),
                z: l.topTens + 1,
                name: l.name,
                topTens: l.topTens,
                color: l.wins > 0 ? chartColors[1] : chartColors[0]
            }))
        }]
    };

    // Line chart for trends over time
    const trendChartOptions: Highcharts.Options = {
        chart: {
            type: 'line',
            backgroundColor: 'transparent'
        },
        title: {
            text: 'Language Trends Over Time (Top 5 Languages)'
        },
        xAxis: {
            categories: yearsSorted.map(y => y.toString()),
            labels: {
                rotation: -45,
                style: {
                    fontSize: '10px'
                }
            }
        },
        yAxis: {
            title: {
                text: 'Number of Songs'
            },
            min: 0
        },
        tooltip: {
            shared: true
        },
        plotOptions: {
            line: {
                lineWidth: 2,
                marker: {
                    enabled: false
                }
            }
        },
        credits: {
            enabled: false
        },
        series: topLanguages.slice(0, 5).map((lang, index) => ({
            name: lang.name,
            type: 'line',
            data: yearsSorted.map(year => lang.yearlyCounts[year] || 0),
            color: chartColors[index]
        }))
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-10">
                <div className="flex items-center justify-center h-44">
                    <div className={spinner}></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-10">
                <div className="w-full mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Donut chart */}
                        <div className={`${card} p-4 sm:p-6 min-w-0`}>
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={donutChartOptions}
                                />
                            </div>
                        </div>

                        {/* Bar chart */}
                        <div className={`${card} p-4 sm:p-6 min-w-0`}>
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={barChartOptions}
                                />
                            </div>
                        </div>

                        {/* Bubble chart */}
                        <div className={`${card} p-4 sm:p-6 min-w-0`}>
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={bubbleChartOptions}
                                />
                            </div>
                        </div>

                        {/* Trends over time */}
                        <div className={`${card} p-4 sm:p-6 min-w-0`}>
                            <div className="h-[400px]">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={trendChartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Statistics Summary */}
                    <div className={`${card} p-4 sm:p-6`}>
                        <h2 className="text-base font-semibold mb-4 text-[var(--er-text-primary)]">Language Statistics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatTile label="Total Languages" value={data.length} />
                            <StatTile label="Languages with Wins" value={data.filter(l => l.wins > 0).length} />
                        </div>
                    </div>
                </div>

                {/* Song Table Modal */}
    
                
                    <SongTableModal
                        title={`Songs in ${selectedLanguage?.name}`}
                        songs={selectedLanguage?.songs}                        
                        isOpen={showSongTable}
                        onClose={() => {
                            setShowSongTable(false);
                            //setSelectedLanguage(null);
                        }}
                        summaryStats={[
                            { label: 'Total Songs', value: selectedLanguage?.count },
                            { label: 'Wins', value: selectedLanguage?.wins },
                            { label: 'Top 10s', value: selectedLanguage?.topTens },
                            { label: 'Avg Place', value: selectedLanguage?.avgPlace.toFixed(1) }
                        ]}
                    />

            </div>
        </div>
    );
};

export default LanguageDashboard;