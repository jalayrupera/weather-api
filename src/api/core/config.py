from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    openweathermap_api_key: str = os.getenv("OPENWEATHERMAP_API_KEY", "")
    redis_host: str = os.getenv("REDIS_HOST", "redis")
    redis_port: int = int(os.getenv("REDIS_PORT", 6379))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
