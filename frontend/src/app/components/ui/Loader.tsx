'use client';

import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-100">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin">
        </div>
      </div>
      <p className="ml-4 text-xl font-semibold text-gray-700">Loading weather data...</p>
    </div>
  );
};

export default Loader; 