import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartOptions, PointElement, Tick, registerables } from 'chart.js';
import LineChart from './Chart'; // Assuming LineChart is a local component
import { countTooltipHandler } from '../utils/TooltipUtils'; // Assuming TooltipUtils is in this path

Chart.register(...registerables);

interface AverageFinalPlaceData {
    finalRunningOrder: number;
    averageFinalPlace: number | null; // Allow null for cases with no data
}

const RunningOrderChart: React.FC = () => {
    const [data, setData] = useState<AverageFinalPlaceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Consistent color palette from PlaceChart
    const colors = {
        background: 'rgb(30, 41, 59)',      // slate-800
        text: 'rgb(203, 213, 225)',         // slate-300
        line: 'rgb(100, 116, 139)',         // slate-500
        point: 'rgb(226, 232, 240)',        // slate-200
        grid: 'rgb(51, 65, 85)',            // slate-700
        firstPlace: '#FBBF24',              // amber-400 (not used here, but kept for consistency)
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            finalRunningOrders(options: { sort: [{ order: ASC }] }) {
                                order
                                songs {
                                    finalPlace {
                                        place
                                    }
                                }
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            
            // Ensure result.data and result.data.finalRunningOrders exist before processing
            if (result.data && result.data.finalRunningOrders) {
                const averageFinalPlaceData = calculateAveragePlacePerRunningOrder(result.data.finalRunningOrders);
                setData(averageFinalPlaceData);
            } else {
                // Handle cases where data is not in the expected format
                console.error("Fetched data is not in the expected format:", result);
                setData([]);
            }

            setIsLoading(false);
        };

        fetchData();
    }, []);

    /**
     * For each finalRunningOrder, get the average final place and return data in array for chart
     * @param finalRunningOrders The raw data from the GraphQL query.
     * @returns An array of objects formatted for the chart.
     */
    function calculateAveragePlacePerRunningOrder(finalRunningOrders: any[]): AverageFinalPlaceData[] {
        return finalRunningOrders.map((finalRunningOrder: any) => {
            const { order, songs } = finalRunningOrder;
            if (!songs || songs.length === 0) {
                return { finalRunningOrder: order, averageFinalPlace: null };
            }
            const totalFinalPlace = songs.reduce((sum: number, song: any) => sum + (song.finalPlace?.place || 0), 0);
            const averageFinalPlace = Math.round((totalFinalPlace / songs.length) * 10) / 10;
            return { finalRunningOrder: order, averageFinalPlace };
        });
    }

    const chartData = {
        labels: data.map((item) => item.finalRunningOrder),
        datasets: [
            {
                label: 'Average Final Place',
                data: data.map((item) => item.averageFinalPlace),
                fill: false,
                borderColor: colors.line, 
                tension: 0.1,
                spanGaps: true,
                pointHitRadius: 20,
                pointRadius: 4,
                pointHoverRadius: 10,
                pointBackgroundColor: colors.point, 
                pointBorderColor: colors.point, 
                pointStyle: 'circle',
            },
        ],
    };

    const chartOptions: ChartOptions = {
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: false,
                position: 'nearest',
                external: countTooltipHandler,
            },
            legend: {
                labels: {
                    color: colors.text, 
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Final Running Order',
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
                min: data.length > 0 ? Math.min(...data.map(item => item.averageFinalPlace || 20)) - 2 : 0,
                max: data.length > 0 ? Math.max(...data.map(item => item.averageFinalPlace || 0)) + 2 : 26,
                ticks: {
                    color: colors.text, 
                    stepSize: 2,
                    callback: (value: number | string) => {
                        if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
                            return `${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'}`;
                        }
                        // Return an empty string for non-integer or zero values to avoid clutter
                        return Number.isInteger(value) && value as number > 0 ? value : '';
                    },
                },
                grid: {
                    color: colors.grid, 
                },
                title: {
                    display: true,
                    text: 'Average Final Place',
                    color: colors.text,
                },
            },
        },
    };

    return (
        // Using a darker background for the chart container for consistency with PlaceChart
        <div className="container marker:mt-4 max-w-[90vw] m-auto mt-[2em] mb-[2em] p-4 bg-slate-600 rounded-lg shadow-lg">
            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    {/* Updated spinner color to be more visible on the dark background */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-300"></div>
                </div>
            ) : (
                // Set a specific height for the chart container
                <div className="h-[400px] w-full mt-[2em]">
                    <LineChart data={chartData} options={chartOptions} />
                </div>
            )}
        </div>
    );
};

export default RunningOrderChart;
