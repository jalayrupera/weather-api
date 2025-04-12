import httpx
from src.api.core.config import settings
import logging

logger = logging.getLogger(__name__)

class OpenWeatherMapClient:
    def __init__(self):
        self.api_key = settings.openweathermap_api_key
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"

    async def get_current_weather(self, city: str, units: str = "metric"):
        try:
            lat, lon = await self.get_coordinates(city)
            url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={self.api_key}&units={units}&exclude=minutely,daily"
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except ValueError as e:
            logger.exception(f"ValueError: {e}")
            raise ValueError(str(e))
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.exception(f"HTTPStatusError: {e}")
                raise ValueError("City not found")
            raise
        except httpx.RequestError as e:
            logger.exception(f"RequestError: {e}")
            raise Exception("Could not connect to OpenWeatherMap API")

    async def get_weather_by_coordinates(self, lat: float, lon: float, units: str = "metric"):
        try:
            url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={self.api_key}&units={units}&exclude=minutely,daily"
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                
                
                reverse_geo_url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={self.api_key}&lang=en"
                rev_response = await client.get(reverse_geo_url)
                rev_response.raise_for_status()
                rev_data = rev_response.json()
                
                
                weather_data = response.json()
                
                
                if rev_data and len(rev_data) > 0:
                    name = rev_data[0].get("name", "")
                    
                    if name:
                        name = name.encode('ascii', 'replace').decode('ascii')
                        weather_data["name"] = name
                
                return weather_data
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.exception(f"HTTPStatusError: {e}")
                raise ValueError("Location not found")
            raise
        except httpx.RequestError as e:
            logger.exception(f"RequestError: {e}")
            raise Exception("Could not connect to OpenWeatherMap API")

    async def get_coordinates(self, city: str):
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={self.api_key}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                if not data:
                    raise ValueError("City not found")
                return data[0]["lat"], data[0]["lon"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    logger.exception(f"HTTPStatusError: {e}")
                    raise ValueError("City not found")
                raise
            except httpx.RequestError as e:
                logger.exception(f"RequestError: {e}")
                raise Exception("Could not connect to OpenWeatherMap API")
