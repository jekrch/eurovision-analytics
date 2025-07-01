import React from 'react';
import RunningOrderChart from './RunningOrderChart';
import LanguageChart from './LanguageChart';
import Header from './Header';
import SongwriterPowerRankings from './SongwriterPowerRankings';
import SongwriterHighchartsDashboard from './SongwriterHighchartsDashboard';

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
            {/* <SongwriterPowerRankings/> */}
            <SongwriterHighchartsDashboard/>
          </div>
  );
};

export default StatCharts;