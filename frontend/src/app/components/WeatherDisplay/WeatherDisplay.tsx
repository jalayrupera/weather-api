'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WeatherData, Units } from '../../../types/weather';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
  units: Units;
  highPrecision?: boolean;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  weather,
  isLoading,
  error,
  refreshWeather,
  units,
  highPrecision = true,
}) => {
  // Store last update time in state to fix hydration issues
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Use ref to track the interval and prevent multiple intervals
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref to track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(false);
  
  // Safe setState function that only updates state if component is mounted
  const safeSetLastUpdated = useCallback((value: string) => {
    if (isMounted.current) {
      setLastUpdated(value);
    }
  }, []);
  
  // Update time function that can be called without creating infinite loops
  const updateTime = useCallback(() => {
    try {
      safeSetLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error updating time:', err);
    }
  }, [safeSetLastUpdated]);
  
  // Set up time refresh interval only once when component mounts
  useEffect(() => {
    // Mark as mounted
    isMounted.current = true;
    
    // Set initial time
    updateTime();
    
    // Clean up any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set up new interval
    intervalRef.current = setInterval(updateTime, 60000);
    
    // Clean up on unmount
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateTime]);  // Only depend on the stable updateTime callback
  
  const sanitizeName = (name: string) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const getTemperatureUnit = () => (units === Units.Metric ? '°C' : '°F');
  const getSpeedUnit = () => (units === Units.Metric ? 'm/s' : 'mph');
  const getLocationType = () => (highPrecision ? 'Precise Location' : 'General Area');

  if (isLoading) {
    return (
      <div className="p-8 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 mx-auto"></div>
            <div className="h-16 bg-gray-200 rounded w-1/2 mb-6 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6 mx-auto"></div>
            
            <div className="flex justify-center gap-4 my-6">
              <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <p className="text-gray-500 text-center mt-6">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={refreshWeather}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (error && weather) {
    // Skip showing the error banner for errors related to location during unit changes
    const shouldShowWarning = !error.includes('location');
    
    return (
      <div>
        {shouldShowWarning && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-gray-700">{error}</p>
            <button
              onClick={refreshWeather}
              className="mt-2 px-4 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              Retry Location Access
            </button>
          </div>
        )}
        
        <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold" lang="en">{weather.name ? sanitizeName(weather.name) : 'Unknown Location'}</h2>
              <div className="mt-1 text-xs bg-white bg-opacity-20 rounded px-2 py-1 inline-block">
                Fallback Location
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                {weather.weather && weather.weather.length > 0 && (
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    className="w-16 h-16"
                  />
                )}
              </div>
              <p className="text-lg capitalize">{weather.weather && weather.weather.length > 0 ? weather.weather[0].description : 'Unknown'}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-5xl font-bold">{Math.round(weather.main.temp)}{getTemperatureUnit()}</p>
                <p className="text-lg">Feels like {Math.round(weather.main.feels_like)}{getTemperatureUnit()}</p>
              </div>
              <button
                onClick={refreshWeather}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                aria-label="Refresh weather"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <p className="text-sm opacity-80">Wind</p>
              <p className="text-lg font-semibold">{weather.wind.speed} {getSpeedUnit()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <p className="text-sm opacity-80">Humidity</p>
              <p className="text-lg font-semibold">{weather.main.humidity}%</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <p className="text-sm opacity-80">UV Index</p>
              <p className="text-lg font-semibold">{weather.uv_index}</p>
            </div>
          </div>
          
          <div className="mt-4 text-xs opacity-70">
            <p>Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Weather Data</h2>
        <p className="text-gray-600 mb-4">Unable to load weather information.</p>
        <button
          onClick={refreshWeather}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  const weatherItem = weather.weather && weather.weather.length > 0 ? weather.weather[0] : null;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg text-white">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold" lang="en">{weather.name ? sanitizeName(weather.name) : 'Unknown Location'}</h2>
          <div className="mt-1 text-xs bg-white bg-opacity-20 rounded px-2 py-1 inline-block">
            {getLocationType()}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end">
            {weatherItem && (
              <img
                src={`https://openweathermap.org/img/wn/${weatherItem.icon}@2x.png`}
                alt={weatherItem.description}
                className="w-16 h-16"
              />
            )}
          </div>
          <p className="text-lg capitalize">{weatherItem ? weatherItem.description : 'Unknown'}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-5xl font-bold">{Math.round(weather.main.temp)}{getTemperatureUnit()}</p>
            <p className="text-lg">Feels like {Math.round(weather.main.feels_like)}{getTemperatureUnit()}</p>
          </div>
          <button
            onClick={refreshWeather}
            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
            aria-label="Refresh weather"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
          <p className="text-sm opacity-80">Wind</p>
          <p className="text-lg font-semibold">{weather.wind.speed} {getSpeedUnit()}</p>
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
          <p className="text-sm opacity-80">Humidity</p>
          <p className="text-lg font-semibold">{weather.main.humidity}%</p>
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
          <p className="text-sm opacity-80">UV Index</p>
          <p className="text-lg font-semibold">{weather.uv_index}</p>
        </div>
      </div>
      
      <div className="mt-4 text-xs opacity-70">
        <p>Last updated: {lastUpdated}</p>
      </div>
    </div>
  );
};

export default WeatherDisplay; 