from src.api.clients.openweathermap_client import OpenWeatherMapClient
from src.api.clients.redis_client import RedisClient
from fastapi import Depends, BackgroundTasks
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self, openweathermap_client: OpenWeatherMapClient = Depends(), redis_client: RedisClient = Depends()):
        self.openweathermap_client = openweathermap_client
        self.redis_client = redis_client

    async def fetch_weather(self, city: str, units: str = "metric", background_tasks: Optional[BackgroundTasks] = None):
        
        cached_data = await self.redis_client.get_weather(city, units)
        if cached_data:
            
            forecast_data = await self.redis_client.get_hourly_forecast(city, units)
            if not forecast_data and not await self.redis_client.is_forecast_pending(city, units):
                await self.redis_client.set_forecast_pending(city, units)
                if background_tasks:
                    background_tasks.add_task(self.refresh_forecast, city, units)
            return cached_data

        
        try:
            full_weather_data = await self.openweathermap_client.get_current_weather(city, units)

            
            current_weather = {
                "name": city,
                "main": {
                    "temp": full_weather_data["current"]["temp"],
                    "feels_like": full_weather_data["current"]["feels_like"],
                    "humidity": full_weather_data["current"]["humidity"]
                },
                "weather": full_weather_data["current"]["weather"],
                "wind": {"speed": full_weather_data["current"]["wind_speed"]},
                "pop": full_weather_data["hourly"][0]["pop"],
                "uv_index": full_weather_data["current"]["uvi"]
            }
            hourly_forecast = full_weather_data["hourly"]

            
            await self.redis_client.set_weather(city, current_weather, units)

            
            await self.redis_client.set_forecast_pending(city, units)
            if background_tasks:
                background_tasks.add_task(self.store_forecast, city, hourly_forecast, units)

            return current_weather
        except ValueError as e:
            logger.exception(f"ValueError: {e}")
            raise ValueError(str(e))
        except Exception as e:
            logger.exception(f"Exception: {e}")
            raise Exception(f"Error fetching weather data: {str(e)}")

    async def fetch_weather_by_coordinates(self, lat: float, lon: float, units: str = "metric", background_tasks: Optional[BackgroundTasks] = None):
        
        location_key = f"{lat:.4f},{lon:.4f}"
        
        
        cached_data = await self.redis_client.get_weather(location_key, units)
        if cached_data:
            
            forecast_data = await self.redis_client.get_hourly_forecast(location_key, units)
            if not forecast_data and not await self.redis_client.is_forecast_pending(location_key, units):
                await self.redis_client.set_forecast_pending(location_key, units)
                if background_tasks:
                    background_tasks.add_task(self.refresh_forecast_by_coordinates, lat, lon, units)
            return cached_data

        
        try:
            full_weather_data = await self.openweathermap_client.get_weather_by_coordinates(lat, lon, units)

            
            current_weather = {
                "name": f"Location ({lat:.4f}, {lon:.4f})",
                "main": {
                    "temp": full_weather_data["current"]["temp"],
                    "feels_like": full_weather_data["current"]["feels_like"],
                    "humidity": full_weather_data["current"]["humidity"]
                },
                "weather": full_weather_data["current"]["weather"],
                "wind": {"speed": full_weather_data["current"]["wind_speed"]},
                "pop": full_weather_data["hourly"][0]["pop"],
                "uv_index": full_weather_data["current"]["uvi"]
            }
            hourly_forecast = full_weather_data["hourly"]
            
            
            if "name" in full_weather_data and full_weather_data["name"]:
                current_weather["name"] = full_weather_data["name"]

            
            await self.redis_client.set_weather(location_key, current_weather, units)

            
            await self.redis_client.set_forecast_pending(location_key, units)
            if background_tasks:
                background_tasks.add_task(self.store_forecast, location_key, hourly_forecast, units)

            return current_weather
        except ValueError as e:
            logger.exception(f"ValueError: {e}")
            raise ValueError(str(e))
        except Exception as e:
            logger.exception(f"Exception: {e}")
            raise Exception(f"Error fetching weather data: {str(e)}")

    async def get_hourly_forecast(self, key: str, units: str = "metric"):
        
        return await self.redis_client.get_hourly_forecast(key, units)

    async def store_forecast(self, key: str, forecast: list, units: str = "metric"):
        try:
            
            formatted_forecast = {"hourly_forecast": forecast}
            
            
            await self.redis_client.set_hourly_forecast(key, formatted_forecast, units)
            
            
            await self.redis_client.redis.delete(f"forecast_pending:{key}:{units}")
        except Exception as e:
            logger.exception(f"Error in store_forecast: {e}")
            
            await self.redis_client.redis.delete(f"forecast_pending:{key}:{units}")

    async def refresh_forecast(self, city: str, units: str = "metric"):
        try:
            full_weather_data = await self.openweathermap_client.get_current_weather(city, units)
            hourly_forecast = full_weather_data["hourly"]
            await self.store_forecast(city, hourly_forecast, units)
        except Exception as e:
            logger.exception(f"Error refreshing forecast: {e}")
        finally:
            
            await self.redis_client.redis.delete(f"forecast_pending:{city}:{units}")
            
    async def refresh_forecast_by_coordinates(self, lat: float, lon: float, units: str = "metric"):
        location_key = f"{lat:.4f},{lon:.4f}"
        try:
            full_weather_data = await self.openweathermap_client.get_weather_by_coordinates(lat, lon, units)
            hourly_forecast = full_weather_data["hourly"]
            await self.store_forecast(location_key, hourly_forecast, units)
        except Exception as e:
            logger.exception(f"Error refreshing forecast by coordinates: {e}")
        finally:
            
            await self.redis_client.redis.delete(f"forecast_pending:{location_key}:{units}")