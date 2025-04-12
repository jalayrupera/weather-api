import redis.asyncio as redis
import json
from src.api.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)

    async def get_weather(self, key: str, units: str = "metric"):
        cache_key = f"weather:{key}:{units}"
        data = await self.redis.get(cache_key)
        if data:
            return json.loads(data)
        return None

    async def set_weather(self, key: str, value: dict, units: str = "metric"):
        cache_key = f"weather:{key}:{units}"
        await self.redis.setex(cache_key, 900, json.dumps(value))  

    async def get_hourly_forecast(self, key: str, units: str = "metric"):
        cache_key = f"forecast:{key}:{units}"
        data = await self.redis.get(cache_key)
        if data:
            return json.loads(data)
        return None

    async def set_hourly_forecast(self, key: str, value: dict, units: str = "metric"):
        cache_key = f"forecast:{key}:{units}"
        await self.redis.setex(cache_key, 1800, json.dumps(value))  

    async def set_forecast_pending(self, key: str, units: str = "metric"):
        await self.redis.setex(f"forecast_pending:{key}:{units}", 60, "1")  

    async def is_forecast_pending(self, key: str, units: str = "metric"):
        return await self.redis.exists(f"forecast_pending:{key}:{units}")

    async def close(self):
        await self.redis.close()