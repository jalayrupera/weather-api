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
}

export interface LocationStore {
  location: LocationData | null;
  coordinates: LocationData & { timestamp: number } | null;
  locationHistory: Array<LocationData & { timestamp: number }>;
  loading: boolean;
  error: string | null;
  highPrecision: boolean;
  isLocationValid: boolean;
  locationValidationMessage: string | null;
  watchId: number | null;
  
  setLocation: (location: LocationData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHighPrecision: (highPrecision: boolean) => void;
  setLocationValid: (isValid: boolean) => void;
  setLocationValidationMessage: (message: string | null) => void;
  setWatchId: (id: number | null) => void;
  
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  validateLocation: (location: LocationData) => Promise<boolean>;
  processPosition: (position: GeolocationPosition) => Promise<void>;
}

export interface WeatherCache {
  data: WeatherData | HourlyForecastResponse;
  timestamp: number;
}

export interface WeatherStore {
  weather: WeatherData | null;
  forecast: HourlyForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  units: Units;
  
  weatherCache: Map<string, WeatherCache>;
  forecastCache: Map<string, WeatherCache>;
  
  setWeather: (weather: WeatherData | null) => void;
  setForecast: (forecast: HourlyForecastResponse | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUnits: (units: Units) => void;
  
  fetchWeatherData: (
    location: LocationData | null, 
    isLocationValid: boolean, 
    forceRefresh?: boolean
  ) => Promise<void>;
  refreshWeather: () => Promise<void>;
}