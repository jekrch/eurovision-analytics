// Home.tsx
import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import PlaceChart from './PlaceChart';
import RunningOrderChart from './RunningOrderChart';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('placeChart');
  const [isOpen, setIsOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <div className="bg-slate-200 min-h-[100vh] w-full">
      <nav className="bg-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <span className="text-gray-200 text-xl font-bold font-sans tracking-tighter">
                Eurovision Analytics
              </span>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <button
                    className={`${
                      activeTab === 'placeChart'
                        ? 'bg-slate-600 text-white'
                        : 'text-gray-300 hover:bg-slate-600 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                    onClick={() => handleTabChange('placeChart')}
                  >
                    Place Chart
                  </button>
                  <button
                    className={`${
                      activeTab === 'runningOrderChart'
                        ? 'bg-slate-600 text-white'
                        : 'text-gray-300 hover:bg-slate-600 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                    onClick={() => handleTabChange('runningOrderChart')}
                  >
                    Running Order Chart
                  </button>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-white hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-300"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <div className={`relative w-6 h-6`}>
                  <div
                    className={`absolute top-1 left-0 w-full h-0.5 bg-white rounded transition-all duration-300 ${
                      isOpen ? 'top-1/2 rotate-45 transform -translate-y-1/2' : ''
                    }`}
                  ></div>
                  <div
                    className={`absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-0.5 bg-white rounded transition-all duration-300 ${
                      isOpen ? 'opacity-0' : ''
                    }`}
                  ></div>
                  <div
                    className={`absolute bottom-1 left-0 w-full h-0.5 bg-white rounded transition-all duration-300 ${
                      isOpen ? 'bottom-1/2 -rotate-45 transform translate-y-1/2' : ''
                    }`}
                  ></div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="-mr-2 flex md:hidden overflow-hidden">
          <CSSTransition
            in={isOpen}
            timeout={500}
            classNames="menu-transition"
            unmountOnExit
          >
            <div className="md:hidden" id="mobile-menu">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <button
                  className={`${
                    activeTab === 'placeChart'
                      ? 'bg-slate-600 text-white'
                      : 'text-gray-300 hover:bg-slate-600 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => handleTabChange('placeChart')}
                >
                  Place Chart
                </button>
                <button
                  className={`${
                    activeTab === 'runningOrderChart'
                      ? 'bg-slate-600 text-white'
                      : 'text-gray-300 hover:bg-slate-600 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => handleTabChange('runningOrderChart')}
                >
                  Running Order Chart
                </button>
              </div>
            </div>
          </CSSTransition>
        </div>
      </nav>

      <div className="mx-10 items-center justify-center flex flex-row">
        {activeTab === 'placeChart' ? <PlaceChart /> : <RunningOrderChart />}
      </div>
    </div>
  );
};

export default Home;