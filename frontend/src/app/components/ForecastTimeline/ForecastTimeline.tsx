'use client';

import React from 'react';
import { HourlyForecastResponse, HourlyForecast, Units } from '../../../types/weather';

interface ForecastTimelineProps {
  forecast: HourlyForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  units: Units;
}

const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  forecast,
  isLoading,
  error,
  units
}) => {
  const getTemperatureUnit = () => (units === Units.Metric ? '°C' : '°F');

  if (isLoading) {
    return (
      <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Hourly Forecast</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-24 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !forecast) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 rounded-xl shadow-lg p-4">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Forecast Error</h2>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl shadow-lg p-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Forecast Data</h2>
        <p className="text-gray-600">Hourly forecast information is unavailable.</p>
      </div>
    );
  }

  const hourlyData = forecast.hourly_forecast ? forecast.hourly_forecast.slice(0, 8) : [];

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Hourly Forecast
      </h2>

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {hourlyData.map((hour, index) => {
          const weatherItem = hour.weather && hour.weather.length > 0 ? hour.weather[0] : null;
          return (
            <div key={index} className="flex-shrink-0 w-24 text-center">
              <p className="font-medium text-gray-700">{formatTime(hour.dt)}</p>
              <div className="my-2">
                {weatherItem && (
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherItem.icon}@2x.png`}
                    alt={weatherItem.description}
                    className="w-10 h-10 mx-auto"
                  />
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{Math.round(hour.temp)}{getTemperatureUnit()}</p>
              <p className="text-xs text-gray-500 capitalize">{weatherItem ? weatherItem.description : 'Unknown'}</p>
              
              <div className="mt-2 text-xs">
                <p className="text-gray-600">
                  <span className="inline-block w-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </span>
                  {hour.humidity}%
                </p>
                <p className="text-gray-600">
                  <span className="inline-block w-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
                    </svg>
                  </span>
                  {hour.wind_speed}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastTimeline; 