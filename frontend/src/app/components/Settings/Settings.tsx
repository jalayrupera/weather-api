'use client';

import React, { useState, useCallback } from 'react';
import { Units } from '../../../types/weather';
import { useWeatherStore } from '../../../store/weatherStore';
import { useLocationStore } from '../../../store/locationStore';

interface SettingsProps {
  units: Units;
  setUnits: (units: Units) => void;
  refreshWeather: () => Promise<void>;
  highPrecision: boolean;
  setHighPrecision: (highPrecision: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  units, 
  setUnits, 
  refreshWeather,
  highPrecision,
  setHighPrecision
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const location = useLocationStore(state => state.location);
  const isLocationValid = useLocationStore(state => state.isLocationValid);
  const startLocationTracking = useLocationStore(state => state.startLocationTracking);
  const fetchWeatherData = useWeatherStore(state => state.fetchWeatherData);

  const handlePrecisionToggle = () => {
    setTimeout(() => {
      setHighPrecision(!highPrecision);
      
      setTimeout(() => {
        if (location) {
          fetchWeatherData(location, isLocationValid, true);
        }
      }, 300);
    }, 50);
  };

  const handleUnitsChange = (newUnits: Units) => {
    if (newUnits === units) return;
    
    setUnits(newUnits);
    
    if (location) {
      setTimeout(() => {
        fetchWeatherData(location, isLocationValid, true);
      }, 100);
    } else {
      setTimeout(() => {
        refreshWeather();
      }, 300);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Temperature Units</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleUnitsChange(Units.Metric)}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  units === Units.Metric
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } transition-colors`}
              >
                Celsius (°C)
              </button>
              <button
                onClick={() => handleUnitsChange(Units.Imperial)}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  units === Units.Imperial
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } transition-colors`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Location Precision</h3>
            <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{highPrecision ? 'High Precision' : 'Regular Precision'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {highPrecision
                    ? 'Using exact location (higher battery usage)'
                    : 'Using approximate location (battery efficient)'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  checked={highPrecision}
                  onChange={handlePrecisionToggle}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Location Permissions</h3>
              <p className="text-sm text-gray-600 mb-4">
                This app uses your location to provide accurate weather information. Precise location provides block-level accuracy, while general location provides only city-level data.
              </p>
              <button
                onClick={() => {
                  if (location) {
                    fetchWeatherData(location, isLocationValid, true);
                  } else {
                    refreshWeather();
                  }
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Weather Data
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Settings; 