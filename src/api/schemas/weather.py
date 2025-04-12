from pydantic import BaseModel
from typing import List, Dict, Optional

class WeatherResponse(BaseModel):
    name: str
    main: Dict
    weather: List
    wind: Dict
    pop: float
    uv_index: float

class WeatherItem(BaseModel):
    id: int
    main: str
    description: str
    icon: str

class HourlyForecastEntry(BaseModel):
    dt: int
    temp: float
    feels_like: float
    pressure: int
    humidity: int
    dew_point: float
    uvi: float
    clouds: int
    visibility: int
    wind_speed: float
    wind_deg: int
    wind_gust: Optional[float] = None
    pop: float
    weather: List[WeatherItem]
    
    rain: Optional[Dict[str, float]] = None
    snow: Optional[Dict[str, float]] = None

class HourlyForecastResponse(BaseModel):
    hourly_forecast: List[HourlyForecastEntry]