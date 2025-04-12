import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from unittest.mock import AsyncMock

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
async def mock_redis_client():
    mock = AsyncMock()
    mock.get_weather.return_value = None
    mock.set_weather.return_value = None
    mock.get_forecast.return_value = None
    mock.set_forecast.return_value = None
    return mock
