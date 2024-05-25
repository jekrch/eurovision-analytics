import React from 'react';
import { Line } from 'react-chartjs-2';

interface ChartProps {
    data: {
        labels: (number | string)[];
        datasets: {
            label: string;
            data: (number | null)[];
            fill: boolean;
            borderColor: string;
            tension: number;
        }[];
    };
    options: any;
}

const LineChart: React.FC<ChartProps> = ({ data, options }) => {
    return <Line className="min-h-350 h-[15em]" data={data} options={options as any} />;
};

export default LineChart;