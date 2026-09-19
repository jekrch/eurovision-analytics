import React from 'react';
import RunningOrderChart from './RunningOrderChart';
import Header from './Header';
import SongwriterDashboard from './SongwriterDashboard';
import PlaceChart from './PlaceChart';
import LanguageDashboard from './LanguageDashboard';

const StatCharts: React.FC = () => {
  return (
    <div className="w-full pb-12">
      <Header
        eyebrow="Results"
        title={'Grand Final Results By Country'}
        className="mt-8"
      />

      <PlaceChart />

      <Header
        eyebrow="Songwriters"
        title={'Most Prolific Songwriters'}
      />
      <SongwriterDashboard />

      <Header
        eyebrow="Running Order"
        title={'Average Final Place by Final Running Order'}
      />
      <RunningOrderChart />
      
      <Header
        eyebrow="Languages"
        title={'Language Distribution'}
      />
      <LanguageDashboard />
    </div>
  );
};

export default StatCharts;
