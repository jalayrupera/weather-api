import { create } from 'zustand';
import { WeatherData, Units, HourlyForecastResponse, LocationData, WeatherStore } from '../types/weather';
import { 
  getWeatherByCoordinates, 
  getForecastByCoordinates 
} from '../services/weatherService';
import { useLocationStore } from './locationStore';

// Cache time-to-live in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

interface WeatherCache {
  data: WeatherData | HourlyForecastResponse;
  timestamp: number;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  // Initial state
  weather: null,
  forecast: null,
  isLoading: true,
  error: null,
  units: Units.Metric,
  
  // Initialize caches
  weatherCache: new Map<string, WeatherCache>(),
  forecastCache: new Map<string, WeatherCache>(),
  
  // Simple actions
  setWeather: (weather) => set({ weather }),
  setForecast: (forecast) => set({ forecast }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Set units and refresh data when units change
  setUnits: (units) => {
    const prevUnits = get().units;
    
    // Update units in state
    set({ units });
    
    if (prevUnits !== units) {
      // Get current location from location store
      const { location, isLocationValid } = useLocationStore.getState();
      
      // Only refresh if location is available
      if (location) {
        get().fetchWeatherData(location, isLocationValid, true);
      }
    }
  },
  
  // Main fetch method
  fetchWeatherData: async (location, isLocationValid, forceRefresh = false) => {
    const state = get();
    
    set({ isLoading: true, error: null });
    
    if (location && !isLocationValid) {
      if (state.weather) {
        set({
          error: 'Location validation failed. Using previously loaded weather data.',
          isLoading: false
        });
        return;
      }
      
      set({
        error: 'Weather data is not available due to location security verification failure.',
        isLoading: false
      });
      return;
    }
    
    if (!location) {
      if (state.weather) {
        set({ isLoading: false });
        return;
      }
      
      set({
        error: 'Weather data requires your location. Please enable location access in your browser.',
        isLoading: false
      });
      return;
    }
    
    try {
      const { units, weatherCache, forecastCache } = state;
      
      let weatherData: WeatherData;
      let forecastData: HourlyForecastResponse;
      
      const cacheKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}:${units}`;
      
      if (!forceRefresh) {
        const cachedWeather = weatherCache.get(cacheKey);
        const cachedForecast = forecastCache.get(cacheKey);
        const now = Date.now();
        
        if (cachedWeather && now - cachedWeather.timestamp < CACHE_TTL) {
          weatherData = cachedWeather.data as WeatherData;
        } else {
          try {
            weatherData = await getWeatherByCoordinates(location.latitude, location.longitude, units);
            weatherCache.set(cacheKey, { data: weatherData, timestamp: now });
          } catch (weatherError) {
            throw weatherError;
          }
        }
        
        if (cachedForecast && now - cachedForecast.timestamp < CACHE_TTL) {
          forecastData = cachedForecast.data as HourlyForecastResponse;
        } else {
          try {
            forecastData = await getForecastByCoordinates(location.latitude, location.longitude, units);
            forecastCache.set(cacheKey, { data: forecastData, timestamp: now });
          } catch (forecastError) {
            throw forecastError;
          }
        }
      } else {
        try {
          weatherData = await getWeatherByCoordinates(location.latitude, location.longitude, units);
          
          forecastData = await getForecastByCoordinates(location.latitude, location.longitude, units);
          
          const now = Date.now();
          weatherCache.set(cacheKey, { data: weatherData, timestamp: now });
          forecastCache.set(cacheKey, { data: forecastData, timestamp: now });
        } catch (refreshError) {
          throw refreshError;
        }
      }
      
      const weatherWithUV = {
        ...weatherData,
        uv_index: calculateUVIndex(weatherData, forecastData)
      };
      
      set({
        weather: weatherWithUV,
        forecast: forecastData,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch weather data',
        isLoading: false
      });
    }
  },
  
  // Refresh weather data (force update)
  refreshWeather: async () => {
    const state = get();
    const { location, isLocationValid } = useLocationStore.getState();
    
    set({ 
      isLoading: true, 
      error: null,
    });
    
    if (!location) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { location: updatedLocation, isLocationValid: updatedValidity } = useLocationStore.getState();
      
      if (updatedLocation) {
        return await state.fetchWeatherData(updatedLocation, updatedValidity, true);
      }
      
      if (!state.weather) {
        set({ 
          error: 'Cannot refresh weather without location data. Please enable location access in your browser.',
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
      return;
    }
    
    await state.fetchWeatherData(location, isLocationValid, true);
  }
}));

function calculateUVIndex(weather: WeatherData, forecast: HourlyForecastResponse): number {
  if (!weather || !forecast || !forecast.hasOwnProperty('current')) {
    return 0;
  }
  
  const cloudCoverage = weather.hasOwnProperty('clouds') ? weather.clouds?.all || 0 : 0;
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  
  let baseUV = 0;
  
  if (currentHour >= 10 && currentHour <= 16) {
    baseUV = 8;
  } else if ((currentHour >= 7 && currentHour < 10) || (currentHour > 16 && currentHour <= 19)) {
    baseUV = 4;
  } else {
    baseUV = 1;
  }
  
  let cloudFactor = 1;
  if (cloudCoverage >= 80) {
    cloudFactor = 0.3;
  } else if (cloudCoverage >= 60) {
    cloudFactor = 0.5;
  } else if (cloudCoverage >= 40) {
    cloudFactor = 0.7;
  } else if (cloudCoverage >= 20) {
    cloudFactor = 0.9;
  }
  
  let seasonalFactor = 1;
  const month = currentTime.getMonth();
  if (month >= 5 && month <= 8) {
    seasonalFactor = 1.2;
  } else if (month >= 9 && month <= 10) {
    seasonalFactor = 0.8;
  } else if (month >= 11 || month <= 1) {
    seasonalFactor = 0.6;
  } else {
    seasonalFactor = 1;
  }
  
  let uvIndex = Math.round(baseUV * cloudFactor * seasonalFactor);
  
  return Math.max(0, Math.min(uvIndex, 12));
} 