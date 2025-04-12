from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from src.api.services.weather_service import WeatherService
from src.api.schemas.weather import WeatherResponse, HourlyForecastResponse
from enum import Enum
from typing import Union, Dict

router = APIRouter()

class Units(str, Enum):
    metric = "metric"
    imperial = "imperial"

@router.get("/weather/{city_name}", response_model=WeatherResponse)
async def get_weather(city_name: str, background_tasks: BackgroundTasks, units: Units = Units.metric, weather_service: WeatherService = Depends()):
    try:
        weather_data = await weather_service.fetch_weather(city_name, units.value, background_tasks)
        return weather_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather-by-location", response_model=WeatherResponse)
async def get_weather_by_location(lat: float, lon: float, background_tasks: BackgroundTasks, units: Units = Units.metric, weather_service: WeatherService = Depends()):
    try:
        weather_data = await weather_service.fetch_weather_by_coordinates(lat, lon, units.value, background_tasks)
        return weather_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/{city_name}", response_model=Union[HourlyForecastResponse, Dict])
async def get_forecast(city_name: str, units: Units = Units.metric, weather_service: WeatherService = Depends()):
    
    if await weather_service.redis_client.is_forecast_pending(city_name):
        return {"status": "pending", "retry_after": 30}

    
    forecast_data = await weather_service.get_hourly_forecast(city_name, units.value)
    
    
    if forecast_data is None:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    
    return forecast_data

@router.get("/forecast-by-location", response_model=Union[HourlyForecastResponse, Dict])
async def get_forecast_by_location(lat: float, lon: float, units: Units = Units.metric, weather_service: WeatherService = Depends()):
    
    location_key = f"{lat:.4f},{lon:.4f}"
    
    
    if await weather_service.redis_client.is_forecast_pending(location_key):
        return {"status": "pending", "retry_after": 30}

    
    forecast_data = await weather_service.get_hourly_forecast(location_key, units.value)
    
    
    if forecast_data is None:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    
    return forecast_data