// Home.tsx
import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import PlaceChart from './PlaceChart';
import RunningOrderChart from './RunningOrderChart';
import Navbar from './NavBar';
import LanguageChart from './LanguageChart';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('placeChart');
  const [isOpen, setIsOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const navItems = [
    { label: 'Place Chart', path: 'placeChart' },
    { label: 'Running Order Chart', path: 'runningOrderChart' },
  ];

  return (
    <div className="bg-slate-200 min-h-[100vh] w-full">
      <Navbar items={navItems} handleTabChange={handleTabChange}/>
      <div className="mx-10 items-center justify-center flex flex-row">
        {activeTab !== 'placeChart' ? <PlaceChart /> : 
          <div className="m-auto">
            <RunningOrderChart/>  
            <LanguageChart/> 
          </div>}
      </div>
    </div>
  );
};

export default Home;