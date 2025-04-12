import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from unittest.mock import patch, AsyncMock

client = TestClient(app)

async def test_get_weather_cached(mocker, mock_redis_client):
    mock_weather_data = {"name": "London", "main": {"temp": 10, "feels_like": 5, "humidity": 80}, "weather": [{"description": "Cloudy"}], "wind": {"speed": 5}}
    mock_redis_client.get_weather.return_value = None  
    mock_redis_client.get_forecast.return_value = None 
    mock_get_current_weather = mocker.patch("src.api.clients.openweathermap_client.OpenWeatherMapClient.get_current_weather", return_value=mock_weather_data)
    mock_fetch_forecast = mocker.patch("src.api.services.weather_service.WeatherService.fetch_forecast", return_value=None)
    response = client.get("/weather/London")
    assert response.status_code == 200
    assert response.json()["city_name"] == "London"
    mock_redis_client.set_weather.assert_called_once()
    mock_fetch_forecast.assert_called_once()

async def test_get_weather_cache_hit(mocker, mock_redis_client):
    mock_weather_data = {"name": "London", "main": {"temp": 10, "feels_like": 5, "humidity": 80}, "weather": [{"description": "Cloudy"}], "wind": {"speed": 5}}
    mock_redis_client.get_weather.return_value = mock_weather_data  
    response = client.get("/weather/London")
    assert response.status_code == 200
    assert response.json()["city_name"] == "London"
    mocker.patch("src.api.clients.openweathermap_client.OpenWeatherMapClient.get_current_weather")
    assert not mocker.called

async def test_get_weather_invalid_city(mocker, mock_redis_client):
    mock_redis_client.get_weather.return_value = None
    mocker.patch("src.api.clients.openweathermap_client.OpenWeatherMapClient.get_current_weather", side_effect=ValueError("City not found"))
    response = client.get("/weather/InvalidCity")
    assert response.status_code == 404
    assert response.json()["detail"] == "City not found"

async def test_get_forecast_cached(mocker, mock_redis_client):
    mock_forecast_data = {"list": [{"dt": 1672531200, "main": {"temp": 12, "humidity": 75}, "weather": [{"description": "Rainy"}], "wind": {"speed": 7}, "pop": 0.8}]}
    mock_redis_client.get_forecast.return_value = None
    mocker.patch("src.api.clients.openweathermap_client.OpenWeatherMapClient.get_forecast", return_value=mock_forecast_data)
    response = client.get("/weather/London/forecast")
    assert response.status_code == 200
    assert response.json()["city_name"] == "London"
    assert len(response.json()["forecast"]) > 0
    mock_redis_client.set_forecast.assert_called_once()

async def test_get_forecast_cache_hit(mocker, mock_redis_client):
    mock_forecast_data = {"list": [{"dt": 1672531200, "main": {"temp": 12, "humidity": 75}, "weather": [{"description": "Rainy"}], "wind": {"speed": 7}, "pop": 0.8}]}
    mock_redis_client.get_forecast.return_value = mock_forecast_data
    response = client.get("/weather/London/forecast")
    assert response.status_code == 200
    assert response.json()["city_name"] == "London"
    assert len(response.json()["forecast"]) > 0
    mocker.patch("src.api.clients.openweathermap_client.OpenWeatherMapClient.get_forecast")
    assert not mocker.called

async def test_get_forecast_invalid_city(mocker, mock_redis_client):
    mock_redis_client.get_forecast.return_value = None
    mocker.patch("src.api.clients.openweathermap_client.OpenWeatherMapClient.get_forecast", side_effect=ValueError("City not found"))
    response = client.get("/weather/InvalidCity/forecast")
    assert response.status_code == 404
    assert response.json()["detail"] == "City not found"
