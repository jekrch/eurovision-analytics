import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ChartOptions, ChartType, ScaleType, registerables } from 'chart.js';
import { countTooltipHandler } from '../utils/TooltipUtils';
import Header from './Header';

Chart.register(...registerables);

interface LanguageData {
    name: string;
    count: number;
}

const LanguageChart: React.FC = () => {
    const [data, setData] = useState<LanguageData[]>([]);
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
                            languages {
                                name
                                songs {
                                    id
                                }
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();

            const languageData = result.data.languages.map((language: any) => ({
                name: language.name,
                count: language.songs.length,
            }));

            // sort the languageData array in descending order based on the count
            const sortedLanguageData = languageData.sort((a: any, b: any) => b.count - a.count);

            setData(sortedLanguageData);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    const chartData = {
        labels: data.map((item) => item.name),
        datasets: [
            {
                data: data.map((item) => item.count),
                backgroundColor: [
                    // "#22a7f0", "#48b5c4", "#3c4e4b", "#98d1d1", "#dedad2", "#e4bcad", "#df979e", 
                    // "#0d88e6",  "#d7658b", "#c80064", "#e27c7c", "#a86464", "#6d4b4b", "#503f3f", "#333333", 
                    // "#badbdb", "#466964", "#599e94",  "#b30000", "#7c1158", "#4421af", 
                    // "#1a53ff", "#00b7c7", "#5ad45a", "#8be04e", "#ebdc78", "#115f9a", 
                    // "#1984c5", "#76c68f", "#c9e52f", "#d0ee11", 
                    // "#d0f400"
                    '#6495ED', // Cornflower Blue
                    '#8E44AD', // Wisteria
                    '#3D9970', // Olive
                    '#FF4136', // Red
                    '#0074D9', // Blue
                    '#C44536', // Brick Red
                    '#7FDBFF', // Electric Blue
                    '#2ECC40', // Emerald
                    '#FF6B6B', // Pastel Red
                    '#4ECDC4', // Turquoise
                    //'#FFE66D', // Pastel Yellow
                    '#FF851B', // Orange
                    '#B10DC9', // Purple
                    '#01FF70', // Lime
                    '#F012BE', // Fuchsia
                    '#39CCCC', // Teal
                    //'#FFDC00', // Golden Yellow
                    '#85144B', // Maroon
                    '#7BDCB5', // Aquamarine
                    //'#F0E68C', // Khaki
                    //'#FFFF00', // Yellow
                    '#FF69B4', // Hot Pink
                    '#00A8E8', // Cyan
                    '#FF8C00', // Dark Orange
                    '#BA55D3', // Medium Orchid
                    '#66CC99', // Soft Green
                    '#FFA07A', // Light Salmon
                    '#9370DB', // Medium Purple
                    '#00CED1', // Dark Turquoise
                    '#FFC0CB',  // Pink
                    "#22a7f0", "#48b5c4", "#3c4e4b", 
                ]
            },
        ],
    };

    const chartOptions: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '30%', // donut
        plugins: {
            tooltip: {
                enabled: false,
                position: 'nearest',
                external: countTooltipHandler,
            },
            legend: {
                position: 'bottom',
                labels: {
                    fontSize: 12,
                    padding: 10,
                    boxWidth: 20,
                    boxHeight: 15,
                }
            },
        },
        layout: {
            padding: {
                bottom: 20,
            },
        },
    };

    return (
            <div className="container pb-10 m-auto max-w-[40em]">
                <div className="mb-8 w-full mt-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-44">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-b-6 border-gray-800"></div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[800px] w-[85%] m-auto">
                            <Pie data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>
    );
};

export default LanguageChart;