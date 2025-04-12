export interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  pop: number;
  uv_index: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number;
  pop: number;
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  rain: any;
  snow: any;
}

export interface HourlyForecastResponse {
  hourly_forecast: HourlyForecast[];
}

export enum Units {
  Metric = "metric",
  Imperial = "imperial"
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Zustand store interfaces replacing the old context types
export interface LocationStore {
  // Location data
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  highPrecision: boolean;
  isLocationValid: boolean;
  locationValidationMessage: string | null;
  watchId: number | null;
  
  // Simple actions
  setLocation: (location: LocationData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHighPrecision: (highPrecision: boolean) => void;
  setLocationValid: (isValid: boolean) => void;
  setLocationValidationMessage: (message: string | null) => void;
  setWatchId: (id: number | null) => void;
  
  // Complex actions
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  refreshLocation: () => Promise<void>;
  validateLocation: (locationData: LocationData) => Promise<boolean>;
  processPosition: (position: GeolocationPosition) => Promise<void>;
  handlePositionError: (error: GeolocationPositionError) => void;
}

export interface WeatherCache {
  data: WeatherData | HourlyForecastResponse;
  timestamp: number;
}

export interface WeatherStore {
  // Weather data
  weather: WeatherData | null;
  forecast: HourlyForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  units: Units;
  
  // Caches
  weatherCache: Map<string, WeatherCache>;
  forecastCache: Map<string, WeatherCache>;
  
  // Actions
  setWeather: (weather: WeatherData | null) => void;
  setForecast: (forecast: HourlyForecastResponse | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUnits: (units: Units) => void;
  
  // Fetch methods
  fetchWeatherData: (
    location: LocationData | null, 
    isLocationValid: boolean, 
    forceRefresh?: boolean
  ) => Promise<void>;
  refreshWeather: () => Promise<void>;
} 