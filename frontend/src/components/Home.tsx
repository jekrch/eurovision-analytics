import React from 'react';
import PlaceChart from './PlaceChart';

const Home: React.FC = () => {
  return (
    <>
      <div className="bg-slate-200 min-h-[100vh] w-full">
        <span className="w-full inline-block bg-slate-500 text-gray-200 text-center text-xl font-bold font-sans py-2 tracking-tighter shadow-md">Eurovision Analytics</span>
        <div className="mx-10 items-center justify-center flex flex-row">
          <PlaceChart/>
        </div>
      </div>
    </>
  )
}

export default Home