import { WeatherData, HourlyForecastResponse, Units } from '../types/weather';

const API_BASE_URL = '/api/proxy'; 

const controller = new AbortController();

console.log('Using API base URL:', API_BASE_URL);

export const getWeatherByCity = async (
  cityName: string,
  units: Units = Units.Metric
): Promise<WeatherData> => {
  try {
    
    controller.abort();
    const newController = new AbortController();
    const signal = newController.signal;
    
    const url = `${API_BASE_URL}/weather/${encodeURIComponent(cityName)}?units=${units}`;
    console.log('Fetching weather data from:', url);
    
    const response = await fetch(url, { 
      next: { revalidate: 600 },  
      cache: 'default',  
      signal,
      headers: {
        'Cache-Control': 'max-age=600',  
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Weather request aborted');
      
      return {} as WeatherData;
    }
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

export const getWeatherByCoordinates = async (
  latitude: number,
  longitude: number,
  units: Units = Units.Metric
): Promise<WeatherData> => {
  try {
    
    const url = `${API_BASE_URL}/weather-by-location?lat=${latitude}&lon=${longitude}&units=${units}`;
    console.log('Fetching weather data by coordinates from:', url);
    
    const response = await fetch(url, {
      next: { revalidate: 600 },  
      cache: 'no-cache',  
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching weather data by coordinates:', error);
    throw error;
  }
};

export const getForecastByCity = async (
  cityName: string,
  units: Units = Units.Metric
): Promise<HourlyForecastResponse> => {
  try {
    const url = `${API_BASE_URL}/forecast/${encodeURIComponent(cityName)}?units=${units}`;
    console.log('Fetching forecast data from:', url);
    
    const response = await fetch(url, {
      next: { revalidate: 1800 },  
      cache: 'no-cache',  
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch forecast data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    
    if (data.status === 'pending') {
      throw new Error('Forecast data is being generated. Please try again later.');
    }

    return data;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
};

export const getForecastByCoordinates = async (
  latitude: number,
  longitude: number,
  units: Units = Units.Metric
): Promise<HourlyForecastResponse> => {
  try {
    
    const url = `${API_BASE_URL}/forecast-by-location?lat=${latitude}&lon=${longitude}&units=${units}`;
    console.log('Fetching forecast data by coordinates from:', url);
    
    const response = await fetch(url, {
      next: { revalidate: 1800 },  
      cache: 'no-cache',  
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch forecast data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    
    if (data.status === 'pending') {
      throw new Error('Forecast data is being generated. Please try again later.');
    }

    return data;
  } catch (error) {
    console.error('Error fetching forecast data by coordinates:', error);
    throw error;
  }
}; 