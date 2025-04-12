'use client';

import React, { useState } from 'react';
import { useLocation } from '../../../contexts/LocationContext';
import { Units } from '../../../types/weather';

interface SettingsProps {
  units: Units;
  setUnits: (units: Units) => void;
  refreshWeather: () => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ units, setUnits, refreshWeather }) => {
  const { highPrecision, setHighPrecision, refreshLocation, location, error } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handlePrecisionToggle = () => {
    setHighPrecision(!highPrecision);
    refreshLocation().then(() => refreshWeather());
  };

  const handleUnitsChange = (newUnits: Units) => {
    setUnits(newUnits);
    // The useWeather hook now handles refreshing weather data when units change
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
        aria-label="Open settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Location Precision</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">
                    {highPrecision ? 'Using precise (block-level) location' : 'Using general (city-level) location'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {highPrecision
                      ? 'Provides more accurate local weather'
                      : 'Less accurate but more privacy-focused'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={highPrecision}
                    onChange={handlePrecisionToggle}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {location && highPrecision && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  Precision: ~{Math.round(location?.accuracy || 0)}m
                </div>
              )}

              {error && highPrecision && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Temperature Units</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleUnitsChange(Units.Metric)}
                  className={`px-4 py-2 rounded-lg flex-1 font-medium ${units === Units.Metric
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Celsius (°C)
                </button>
                <button
                  onClick={() => handleUnitsChange(Units.Imperial)}
                  className={`px-4 py-2 rounded-lg flex-1 font-medium ${units === Units.Imperial
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Location Permissions</h3>
              <p className="text-sm text-gray-600 mb-4">
                This app uses your location to provide accurate weather information. Precise location provides block-level accuracy, while general location provides only city-level data.
              </p>
              <button
                onClick={() => {
                  refreshLocation().then(() => refreshWeather());
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Location Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings; 