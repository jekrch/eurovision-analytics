import React from 'react';
import RunningOrderChart from './RunningOrderChart';
import LanguageChart from './LanguageChart';
import Header from './Header';

const StatCharts: React.FC = () => {
  return (
          <div className="w-[100vw]">
            <Header 
                title={'Average Final Place by Final Running Order'}
            />
            <RunningOrderChart/>  
            <Header 
                title={'Language Distribution'}
            />
            <LanguageChart/> 
          </div>
  );
};

export default StatCharts;