'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { getWeatherByCoordinates, getWeatherByCity, getForecastByCoordinates, getForecastByCity } from '../services/weatherService';
import { WeatherData, HourlyForecastResponse, Units, LocationData } from '../types/weather';

interface UseWeatherReturn {
  weather: WeatherData | null;
  forecast: HourlyForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
  units: Units;
  setUnits: (units: Units) => void;
}

const weatherCache = new Map<string, {data: WeatherData, timestamp: number}>();
const forecastCache = new Map<string, {data: HourlyForecastResponse, timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; 

export const useWeather = (fallbackCity: string = 'Bhavnagar'): UseWeatherReturn => {
  const { 
    location, 
    loading: locationLoading, 
    error: locationError, 
    highPrecision, 
    isLocationValid
  } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<HourlyForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Units>(Units.Metric);
  
  
  const prevLocationRef = useRef<LocationData | null>(null);
  
  const prevUnitsRef = useRef<Units>(units);
  
  const lastLocationTimestampRef = useRef<number | null>(null);
  
  const initialLoadRef = useRef<boolean>(false);

  
  const fetchWeatherData = useCallback(async (forceRefresh = false) => {
    if (locationLoading && !forceRefresh) return;
    
    setIsLoading(true);
    setError(null);
    
    
    if (location && !isLocationValid) {
      console.log('Blocking ALL weather API calls due to location spoofing detection');
      setError('Weather data is not available due to location security verification failure.');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log(`Fetching weather data with units=${units}, forceRefresh=${forceRefresh}`);
      let weatherData: WeatherData;
      let forecastData: HourlyForecastResponse;

      
      if (location && isLocationValid) {
        console.log(`Using coordinates: lat=${location.latitude}, lon=${location.longitude}, units=${units}`);
        
        
        const cacheKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}:${units}`;
        
        
        if (!forceRefresh) {
          const cachedWeather = weatherCache.get(cacheKey);
          const cachedForecast = forecastCache.get(cacheKey);
          const now = Date.now();
          
          if (cachedWeather && now - cachedWeather.timestamp < CACHE_TTL) {
            weatherData = cachedWeather.data;
            console.log('Using cached weather data');
          } else {
            weatherData = await getWeatherByCoordinates(location.latitude, location.longitude, units);
            weatherCache.set(cacheKey, {data: weatherData, timestamp: now});
          }
          
          if (cachedForecast && now - cachedForecast.timestamp < CACHE_TTL) {
            forecastData = cachedForecast.data;
            console.log('Using cached forecast data');
          } else {
            forecastData = await getForecastByCoordinates(location.latitude, location.longitude, units);
            forecastCache.set(cacheKey, {data: forecastData, timestamp: now});
          }
        } else {
          
          weatherData = await getWeatherByCoordinates(location.latitude, location.longitude, units);
          forecastData = await getForecastByCoordinates(location.latitude, location.longitude, units);
          
          
          const now = Date.now();
          weatherCache.set(cacheKey, {data: weatherData, timestamp: now});
          forecastCache.set(cacheKey, {data: forecastData, timestamp: now});
        }
      } else {
        
        console.log(`Using fallback city: ${fallbackCity} (reason: no location available), units=${units}`);
        
        
        const cacheKey = `${fallbackCity}:${units}`;
        
        
        if (!forceRefresh) {
          const cachedWeather = weatherCache.get(cacheKey);
          const cachedForecast = forecastCache.get(cacheKey);
          const now = Date.now();
          
          if (cachedWeather && now - cachedWeather.timestamp < CACHE_TTL) {
            weatherData = cachedWeather.data;
            console.log('Using cached city weather data');
          } else {
            weatherData = await getWeatherByCity(fallbackCity, units);
            weatherCache.set(cacheKey, {data: weatherData, timestamp: now});
          }
          
          if (cachedForecast && now - cachedForecast.timestamp < CACHE_TTL) {
            forecastData = cachedForecast.data;
            console.log('Using cached city forecast data');
          } else {
            forecastData = await getForecastByCity(fallbackCity, units);
            forecastCache.set(cacheKey, {data: forecastData, timestamp: now});
          }
        } else {
          
          weatherData = await getWeatherByCity(fallbackCity, units);
          forecastData = await getForecastByCity(fallbackCity, units);
          
          
          const now = Date.now();
          weatherCache.set(cacheKey, {data: weatherData, timestamp: now});
          forecastCache.set(cacheKey, {data: forecastData, timestamp: now});
        }
      }

      console.log('Weather data received:', weatherData);
      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching weather data';
      console.error('Error in fetchWeatherData:', errorMessage);
      setError(errorMessage);
      
      
      if (location && isLocationValid) {
        try {
          console.log(`Trying fallback city after error: ${fallbackCity}, units=${units}`);
          const fallbackWeather = await getWeatherByCity(fallbackCity, units);
          const fallbackForecast = await getForecastByCity(fallbackCity, units);
          setWeather(fallbackWeather);
          setForecast(fallbackForecast);
          setError(`Using ${fallbackCity} weather due to an error with your location.`);
        } catch (fallbackErr) {
          console.error('Error with fallback city:', fallbackErr);
          setError('Unable to fetch weather data. Please try again later.');
        }
      }
    } finally {
      setIsLoading(false);
      initialLoadRef.current = true;
    }
  }, [location, locationLoading, fallbackCity, units, isLocationValid]);

  
  useEffect(() => {
    
    if (!initialLoadRef.current) {
      console.log('Initial data load with fallback city');
      
      
      if (location && !isLocationValid) {
        console.log('Skipping initial data load due to location validation failure');
        setError('Weather data is not available due to location security verification failure.');
        setIsLoading(false);
        initialLoadRef.current = true;
        return;
      }
      
      
      fetchWeatherData(false);
    }
  }, [location, isLocationValid, fetchWeatherData]);

  
  useEffect(() => {
    
    if (locationLoading) return;

    
    const hasLocationChanged = () => {
      
      if (!prevLocationRef.current && location) {
        return true;
      }
      
      
      if (prevLocationRef.current && !location) {
        return true;
      }
      
      
      if (prevLocationRef.current && location) {
        
        const coordsChanged = 
          Math.abs(prevLocationRef.current.latitude - location.latitude) > 0.0001 || 
          Math.abs(prevLocationRef.current.longitude - location.longitude) > 0.0001;
          
        
        const timestampChanged = location.timestamp !== lastLocationTimestampRef.current;
        
        return coordsChanged || timestampChanged;
      }
      
      return false;
    };
    
    const locationChanged = hasLocationChanged();
    
    
    if (location) {
      prevLocationRef.current = { ...location };
      lastLocationTimestampRef.current = location.timestamp;
    } else {
      prevLocationRef.current = null;
      lastLocationTimestampRef.current = null;
    }

    console.log('Location state:', { 
      location, 
      highPrecision, 
      locationError, 
      locationChanged,
      isLocationValid,
      timestamp: location?.timestamp 
    });
    
    
    if (location && !isLocationValid) {
      console.log('Location validation failed, clearing weather data');
      setWeather(null);
      setForecast(null);
      setError('Weather data is not available due to location security verification failure.');
      return;
    }
    
    
    if (locationChanged) {
      console.log('Location changed, refreshing weather data...');
      fetchWeatherData(true);
    }
    
  }, [location, locationLoading, highPrecision, isLocationValid, fetchWeatherData]);

  
  useEffect(() => {
    
    if (locationLoading || !location || !initialLoadRef.current) return;
    
    
    if (!isLocationValid) {
      console.log('Location became invalid, clearing weather data');
      setWeather(null);
      setForecast(null);
      setError('Weather data is not available due to location security verification failure.');
      return;
    }
    
    
    console.log('Location validation status changed to valid, refreshing data');
    fetchWeatherData(true);
  }, [isLocationValid, location, locationLoading, fetchWeatherData]);

  
  useEffect(() => {
    
    if (initialLoadRef.current && prevUnitsRef.current !== units) {
      console.log(`Units changed from ${prevUnitsRef.current} to ${units}, forcing refetch of weather data...`);
      fetchWeatherData(true); 
    }
    
    
    prevUnitsRef.current = units;
  }, [units, fetchWeatherData]);

  
  const refreshWeather = async () => {
    await fetchWeatherData(true); 
  };

  
  const handleSetUnits = (newUnits: Units) => {
    if (newUnits === units) return; 
    
    console.log(`Setting units to ${newUnits}`);
    setUnits(newUnits);
    
    // Fetch weather data with the new units
    fetchWeatherData(true);
  };

  return {
    weather,
    forecast,
    isLoading,
    error,
    refreshWeather,
    units,
    setUnits: handleSetUnits,
  };
}; 