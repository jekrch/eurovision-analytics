import React, { useState } from 'react';
import PlaceChart from './PlaceChart';
import Navbar from './NavBar';
import StatCharts from './StatCharts';
import Header from './Header';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('placeChart');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const navItems = [
    { label: 'Placement By Country', path: 'placeChart' },
    { label: 'Stat Charts', path: 'runningOrderChart' },
    { label: 'Neo4J', url: 'http://localhost:7474' },
    { label: 'GraphQL', url: 'http://localhost:4000' },
  ];

  return (
    <div className="bg-slate-800 min-h-[100vh] min-w-[100vw] max-w-[100vw] ">
      <Navbar 
        items={navItems} 
        handleTabChange={handleTabChange}
      />
      
      <div className="mx-10 items-center justify-center flex flex-col">
        
        {
          activeTab === 'placeChart' ? 
          <>
            <Header 
                title={'Grand Final Results By Country'}
                className="mt-4"
            />
            
            <PlaceChart /> 
          </>: 
          <StatCharts/>
        } 
      
      </div>
    </div>
  );
};

export default Home;