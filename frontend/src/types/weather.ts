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

export interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  highPrecision: boolean;
  isLocationValid: boolean;
  locationValidationMessage: string | null;
  setHighPrecision: (value: boolean) => void;
  refreshLocation: () => Promise<void>;
} 