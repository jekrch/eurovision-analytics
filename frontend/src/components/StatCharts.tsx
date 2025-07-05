import React from 'react';
import RunningOrderChart from './RunningOrderChart';
import LanguageChart from './LanguageChart';
import Header from './Header';
import SongwriterHighchartsDashboard from './SongwriterHighchartsDashboard';
import PlaceChart from './PlaceChart';

const StatCharts: React.FC = () => {
  return (
    <div className="w-[100vw]">
      <Header
        title={'Grand Final Results By Country'}
        className="mt-4"
      />

      <PlaceChart />

      <Header
        title={'Most Prolific Songwriters'}
      />
      <SongwriterHighchartsDashboard />

      <Header
        title={'Average Final Place by Final Running Order'}
      />
      <RunningOrderChart />
      <Header
        title={'Language Distribution'}
      />
      <LanguageChart />
    </div>
  );
};

export default StatCharts;