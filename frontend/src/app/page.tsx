'use client';

import { useWeatherWithLocation } from '@/hooks/useWeatherWithLocation';
import WeatherDisplay from './components/WeatherDisplay/WeatherDisplay';
import ForecastTimeline from './components/ForecastTimeline/ForecastTimeline';
import Settings from './components/Settings/Settings';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import Loader from './components/ui/Loader';

export default function Home() {
  const [formattedTimestamp, setFormattedTimestamp] = useState<string>('');
  const [permissionRequested, setPermissionRequested] = useState(false);
  const isMounted = useRef(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const lastTimestampRef = useRef<number | null>(null);
  const currentYear = new Date().getFullYear().toString();
  
  const {
    weather,
    forecast,
    
    location,
    highPrecision,
    
    isLoading,
    error,
    isLocationValid,
    
    units,
    setUnits,
    
    refreshWeather,
    refreshLocation,
    setHighPrecision
  } = useWeatherWithLocation();

  const locationTimestamp = useMemo(() => location?.timestamp, [location?.timestamp]);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    let timeoutId: number;
    
    if (isLoading && !location) {
      timeoutId = setTimeout(() => {
        if (isMounted.current) {
          setShowLocationPrompt(true);
        }
      }, 5000);
    } else {
      setShowLocationPrompt(false);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, location]);
  
  useEffect(() => {
    if (!isMounted.current || !location) return;
    
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
  }, [locationTimestamp]);
  
  const handleLocationRequest = () => {
    setPermissionRequested(true);
    
    if (navigator.geolocation) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName })
          .then(status => {
            if (status.state === 'denied') {
              setPermissionRequested(true);
              alert("Location access is blocked. Please enable location permissions in your browser settings and then refresh the page.");
              return;
            }
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                refreshLocation();
              },
              (error) => {
                if (error.code === 1) {
                  const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
                  const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
                  const isSafari = navigator.userAgent.indexOf("Safari") > -1 && !isChrome;
                  
                  let helpMessage = "You've denied location access. ";
                  
                  if (isChrome) {
                    helpMessage += "To enable it, click the lock icon in your address bar, select 'Site settings', and change Location to 'Allow'.";
                  } else if (isFirefox) {
                    helpMessage += "To enable it, click the lock icon in your address bar, then 'Clear Permission' and try again.";
                  } else if (isSafari) {
                    helpMessage += "To enable it, go to Safari > Preferences > Websites > Location and allow for this site.";
                  } else {
                    helpMessage += "Please check your browser settings to enable location permissions for this site.";
                  }
                  
                  alert(helpMessage);
                }
                
                refreshLocation();
              },
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
              }
            );
          });
      } else {
        navigator.geolocation.getCurrentPosition(
          position => refreshLocation(),
          error => {
            if (error.code === 1) {
              alert("You've denied location access. Please check your browser settings to allow location for this site.");
            }
            refreshLocation();
          },
          { 
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
          }
        );
      }
    } else {
      refreshLocation();
    }
  };

  const renderLocationPermissionScreen = () => (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Smart Choices Weather
          </h1>
        </header>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Location Access Required
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This app needs access to your location to show you accurate weather data.</p>
                <p className="mt-2">Please click the button below and allow location access when prompted by your browser.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How to enable location:</h2>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <p>1. Click the button below to access your location</p>
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 flex items-center justify-center">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <p>When prompted, click "Allow" in the browser permission dialog</p>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={handleLocationRequest}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
            >
              Allow Location Access
            </button>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Smart Choices Weather App</p>
          <p className="mt-1">Providing high-precision weather data for your exact location</p>
        </footer>
      </div>
    </main>
  );

  const renderLocationErrorScreen = () => (
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
            onClick={handleLocationRequest}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Location Access
          </button>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Smart Choices Weather App</p>
          <p className="mt-1">Providing high-precision weather data for your exact location</p>
        </footer>
      </div>
    </main>
  );

  const renderValidationErrorScreen = () => (
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
            onClick={handleLocationRequest}
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
          <p>&copy; {currentYear} Smart Choices Weather App</p>
          <p className="mt-1">Providing high-precision weather data for your exact location</p>
        </footer>
      </div>
    </main>
  );

  const renderLoadingScreen = () => (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <Loader />
      <p className="mt-4 text-gray-600">
        {location ? "Updating weather data..." : "Getting your location..."}
      </p>
      
      {showLocationPrompt && !location && (
        <div className="mt-8 max-w-md p-4 bg-yellow-50 border border-yellow-300 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Waiting for Location Permission</h3>
          <p className="text-sm text-yellow-700 mb-3">
            It looks like we're still waiting for location permission. Please check your browser prompt to allow location access.
          </p>
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-yellow-700">
              Look for the location icon in your browser's address bar
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handleLocationRequest}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </main>
  );

  const renderWeatherApp = () => (
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
          <p>&copy; {currentYear} Smart Choices Weather App</p>
          <p className="mt-1">Providing high-precision weather data for your exact location</p>
          <p className="mt-4 text-xs text-gray-400">Powered by Zustand for state management</p>
        </footer>
      </div>
    </main>
  );
  
  if (!permissionRequested && !location) {
    return renderLocationPermissionScreen();
  }

  if (permissionRequested && !location && !isLoading && error) {
    return renderLocationErrorScreen();
  }

  if (location && !isLocationValid) {
    return renderValidationErrorScreen();
  }

  if (isLoading || (permissionRequested && !location) || !weather) {
    return renderLoadingScreen();
  }

  return renderWeatherApp();
}
