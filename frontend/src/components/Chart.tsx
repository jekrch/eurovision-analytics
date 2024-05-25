import React from 'react';
import { Line } from 'react-chartjs-2';

interface ChartProps {
    data: any;
    options: any;
}

const LineChart: React.FC<ChartProps> = ({ data, options }) => {
    return <Line className="min-h-350 h-[15em]" data={data} options={options as any} />;
};

export default LineChart;