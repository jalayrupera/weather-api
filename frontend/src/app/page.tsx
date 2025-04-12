'use client';

import { useWeatherWithLocation } from '@/hooks/useWeatherWithLocation';
import WeatherDisplay from './components/WeatherDisplay/WeatherDisplay';
import ForecastTimeline from './components/ForecastTimeline/ForecastTimeline';
import Settings from './components/Settings/Settings';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import Loader from './components/ui/Loader';

export default function Home() {
  // Add state for timestamp display
  const [formattedTimestamp, setFormattedTimestamp] = useState<string>('');
  
  // Track if the component is mounted
  const isMounted = useRef(false);
  
  // Use ref to track if we've processed this timestamp already
  const lastTimestampRef = useRef<number | null>(null);
  
  const {
    // Weather data
    weather,
    forecast,
    
    // Location data
    location,
    highPrecision,
    
    // Status flags
    isLoading,
    error,
    isLocationValid,
    
    // Units
    units,
    setUnits,
    
    // Actions
    refreshWeather,
    refreshLocation,
    setHighPrecision
  } = useWeatherWithLocation();

  // Create a stable timestamp value with useMemo
  const locationTimestamp = useMemo(() => location?.timestamp, [location?.timestamp]);

  // Handle component mount and unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Update the timestamp display when location changes - but separate from the main effect
  // to avoid infinite loops
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;
    
    // Prevent running during SSR and only when mounted
    if (!isMounted.current) return;
    
    // Only proceed if location exists
    if (!location) return;
    
    // Debounce timestamp updates
    if (location.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = location.timestamp;
      try {
        const formatted = new Date(location.timestamp).toLocaleString();
        setFormattedTimestamp(formatted);
      } catch (err) {
        console.error('Error formatting timestamp:', err);
        setFormattedTimestamp('Unknown');
      }
    }
  }, [locationTimestamp]);  // Only run when location timestamp changes

  // The current year is now calculated during render time
  // and will be the same on server and client
  const currentYear = new Date().getFullYear().toString();

  // No location at all - show location required message
  if (!location && !isLoading) {
    return (
      <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Smart Choices Weather
            </h1>
          </header>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Location Access Required
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || "This app requires location access to show weather for your location."}</p>
                  <p className="mt-2">Please enable location services in your browser and refresh the page.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">How to enable location:</h2>
            <p className="mb-4">This application requires access to your location to provide accurate weather information. To enable location access:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Look for the location icon in your browser's address bar</li>
              <li>Click on it and select "Allow" for location access</li>
              <li>Make sure location services are enabled in your device settings</li>
              <li>Try using a different browser if issues persist</li>
              <li>Ensure you're connected to the internet</li>
            </ul>

            <button
              onClick={() => refreshLocation()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry Location Access
            </button>
          </div>

          <footer className="mt-12 text-center text-sm text-gray-500">
            <p>
              &copy; {currentYear} Smart Choices Weather App
            </p>
            <p className="mt-1">
              Providing high-precision weather data for your exact location
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Powered by Zustand for state management
            </p>
          </footer>
        </div>
      </main>
    );
  }

  if (location && !isLocationValid) {
    return (
      <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Smart Choices Weather
            </h1>
          </header>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Location Validation Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || "We've detected a potential issue with your location data."}</p>
                  <p className="mt-2">For security reasons, weather data is only available with accurate location information.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Why am I seeing this message?</h2>
            <p className="mb-4">Our application requires accurate location data to provide precise weather information. We've detected one of the following issues:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Your location accuracy is too low (more than 90 meters)</li>
              <li>Your device location doesn't match your network location (possible VPN use)</li>
              <li>Your device timezone doesn't match your reported location</li>
              <li>Browser fingerprinting detected unusual changes in your environment</li>
              <li>The location timestamp is inconsistent with your system time</li>
            </ul>
            <p>To resolve this issue, please:</p>
            <ol className="list-decimal pl-5 space-y-2 mb-6">
              <li>Ensure high-precision location is enabled on your device</li>
              <li>Disable any VPN services you might be using</li>
              <li>Check that your device timezone is set correctly</li>
              <li>Make sure your system clock is accurate and synchronized</li>
              <li>Try using a supported browser (Chrome, Firefox, Safari)</li>
            </ol>

            <button
              onClick={() => refreshLocation()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry Location Check
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-2">Technical Information:</h2>
            <div className="overflow-hidden bg-gray-100 rounded p-4 text-sm font-mono">
              <p>• Accuracy: {location.accuracy.toFixed(2)}m</p>
              <p>• Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
              <p>• Timestamp: {formattedTimestamp}</p>
              <p>• Browser: {navigator.userAgent}</p>
              <p>• Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>
          </div>

          <footer className="mt-12 text-center text-sm text-gray-500">
            <p>
              &copy; {currentYear} Smart Choices Weather App
            </p>
            <p className="mt-1">
              Providing high-precision weather data for your exact location
            </p>
          </footer>
        </div>
      </main>
    );
  }

  // Show loading state during initial load
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <Loader />
        <p className="mt-4 text-gray-600">
          {location ? "Updating weather data..." : "Getting your location..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Smart Choices Weather
          </h1>
          <p className="text-gray-600">
            {location && location.accuracy < 100
              ? 'Precise, block-level weather for your exact location'
              : 'Detailed weather for your area'}
          </p>
        </header>

        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <WeatherDisplay
              weather={weather}
              isLoading={isLoading}
              error={error}
              refreshWeather={refreshWeather}
              units={units}
              highPrecision={highPrecision}
            />

            <ForecastTimeline
              forecast={forecast}
              isLoading={isLoading}
              error={error}
              units={units}
            />
          </Suspense>
        </ErrorBoundary>

        <Settings
          units={units}
          setUnits={setUnits}
          refreshWeather={refreshWeather}
          highPrecision={highPrecision}
          setHighPrecision={setHighPrecision}
        />

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            &copy; {currentYear} Smart Choices Weather App
          </p>
          <p className="mt-1">
            Providing high-precision weather data for your exact location
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Powered by Zustand for state management
          </p>
        </footer>
      </div>
    </main>
  );
}
