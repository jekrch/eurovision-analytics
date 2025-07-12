import React from 'react';
import RunningOrderChart from './RunningOrderChart';
import Header from './Header';
import SongwriterDashboard from './SongwriterDashboard';
import PlaceChart from './PlaceChart';
import LanguageDashboard from './LanguageDashboard';

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
      <SongwriterDashboard />

      <Header
        title={'Average Final Place by Final Running Order'}
      />
      <RunningOrderChart />
      
      <Header
        title={'Language Distribution'}
      />
      <LanguageDashboard />
    </div>
  );
};

export default StatCharts;