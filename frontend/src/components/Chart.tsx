import React from 'react';
import { Line } from 'react-chartjs-2';

interface ChartProps {
    data: any;
    options: any;
}

// Chart.js sizes a responsive chart from its parent, so the canvas gets a
// dedicated, relatively positioned box of fixed height to measure.
const LineChart: React.FC<ChartProps> = ({ data, options }) => {
    return (
        <div className="relative h-[18em] w-full">
            <Line data={data} options={options as any} />
        </div>
    );
};

export default LineChart;
