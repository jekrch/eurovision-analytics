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
            <div className="mb-8 w-full mt-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-44">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-b-6 border-gray-800"></div>
                    </div>
                ) : (
                    <div className="h-[900px] w-[75%] mx-auto mt-0">
                        <Pie data={chartData} options={chartOptions} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageChart;