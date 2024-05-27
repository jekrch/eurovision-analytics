import React from 'react';
import RunningOrderChart from './RunningOrderChart';
import LanguageChart from './LanguageChart';

const StatCharts: React.FC = () => {
  return (
          <div className="m-auto">
            <RunningOrderChart/>  
            <LanguageChart/> 
          </div>
  );
};

export default StatCharts;