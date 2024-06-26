import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartOptions, PointElement, Tick, registerables } from 'chart.js';
import LineChart from './Chart';
import { countTooltipHandler, songTooltipHandler } from '../utils/TooltipUtils';
import Header from './Header';

Chart.register(...registerables);

interface AverageFinalPlaceData {
    finalRunningOrder: number;
    averageFinalPlace: number;
}

const RunningOrderChart: React.FC = () => {
    const [data, setData] = useState<AverageFinalPlaceData[]>([]);
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

            const averageFinalPlaceData = calculateAveragePlacePerRunningOrder(result);

            //await delay(4000);
            setData(averageFinalPlaceData);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    /**
     * For each finalRunningOrder, get the average final place and return data in array for chart
     * @param result 
     * @returns 
     */
    function calculateAveragePlacePerRunningOrder(result: any) {
        const finalRunningOrders = result.data.finalRunningOrders;

        const averageFinalPlaceData = finalRunningOrders.map((finalRunningOrder: any) => {
            const { order, songs } = finalRunningOrder;
            const totalFinalPlace = songs.reduce((sum: any, song: any) => sum + song.finalPlace.place, 0);
            const averageFinalPlace = songs.length > 0 ? Math.round((totalFinalPlace / songs.length) * 10) / 10 : null;
            return { finalRunningOrder: order, averageFinalPlace };
        });

        return averageFinalPlaceData;
    }

    const chartData = {
        labels: data.map((item) => item.finalRunningOrder),
        datasets: [
            {
                label: 'Average Final Place',
                data: data.map((item) => item.averageFinalPlace),
                fill: false,
                borderColor: 'rgb(118 163 184)',
                tension: 0.03,
                spanGaps: true,
                pointHitRadius: 20,
                pointRadius: 4,
                pointHoverRadius: 10,
                pointBackgroundColor: 'rgb(118 163 184)',
                pointBorderColor: 'rgb(118 163 184)',
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
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Final Running Order',
                },
            },
            y: {
                reverse: true,
                min: 0,
                max: Math.max(...data.map((item) => item.averageFinalPlace || 0)) + 2,
                ticks: {
                    stepSize: 1,
                    callback: (value: number | string) => {
                        if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
                            return `${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'}`;
                        }
                        return '';
                    },
                },
                title: {
                    display: true,
                    text: 'Average Final Place',
                },
            },
        },
    };

    return (
        <div className="container marker:mt-4 m-auto max-w-[40em] px-5">

            <div className="mb-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-44">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-b-6 border-gray-800"></div>
                    </div>
                ) : (
                    <div className="mb-8 min-w-full mt-[2em]">
                        <LineChart data={chartData} options={chartOptions} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RunningOrderChart;