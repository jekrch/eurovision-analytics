import React from 'react';
import PlaceChart from './PlaceChart';

const Home: React.FC = () => {
  return (
    <>
      <div className="bg-slate-300 h-full w-full">
        <span className="w-full inline-block bg-slate-500 text-gray-200 text-center text-xl font-bold font-sans py-2 ">Eurovision Analytics</span>
        <div className="mx-10">
          <PlaceChart/>
        </div>
      </div>
    </>
  )
}

export default Home