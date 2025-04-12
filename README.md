# Smart Choices Weather App

## Overview

This is a complete weather application with a FastAPI backend and Next.js frontend. The backend service provides real-time weather and forecast data, leveraging Redis caching for optimal performance, while the frontend offers a user-friendly interface with high-precision location-based weather information.

## Project Structure

- **Backend API**: FastAPI-based service providing weather data endpoints
- **Frontend App**: Next.js application with precise location-based weather display

## Features

### Backend:
-   **Real-time Weather & Forecast Data:** Fetches data from the OpenWeatherMap API.
-   **Redis Caching:** Implements Redis caching to minimize API calls and provide faster response times.
-   **Automatic Forecast Pre-fetching:** Automatically fetches forecast data when current weather is requested, improving cache hit rates.
-   **Asynchronous Design:** Built with FastAPI and async Redis for high concurrency.

### Frontend:
- **High-Precision Location**: Uses the browser's Geolocation API with `enableHighAccuracy: true` to provide block-level weather data
- **Fallback Options**: Falls back to city-level data when precise location is unavailable
- **Location Verification**: Validates location data using GPS accuracy checking
- **Unit Customization**: Toggle between metric (°C) and imperial (°F) units
- **Privacy Controls**: Users can choose between precise and general location data
- **Responsive Design**: Fully responsive UI across all devices
- **Error Handling**: Robust error states and user-friendly messages

## API Endpoints

-   `GET /weather/{city_name}`: Returns current weather data for a given city.
    -   Parameters:
        -   `city_name` (string, required): The name of the city.
        -   `units` (string, optional): Units for temperature (default: `metric`, options: `imperial`).
    -   Response:
        ```json
        {
            "city_name": "London",
            "temperature": 10.0,
            "feels_like": 5.0,
            "humidity": 80,
            "description": "Cloudy",
            "wind_speed": 5.0,
            "units": "metric"
        }
        ```
-   `GET /weather/{city_name}/forecast`: Returns forecast data for a given city.
    -   Parameters:
        -   `city_name` (string, required): The name of the city.
        -   `units` (string, optional): Units for temperature (default: `metric`, options: `imperial`).
    -   Response:
        ```json
        {
            "city_name": "London",
            "forecast": [
                {
                    "dt": 1672531200,
                    "temperature": 12.0,
                    "humidity": 75,
                    "description": "Rainy",
                    "wind_speed": 7.0,
                    "pop": 0.8
                }
            ]
        }
        ```

## Getting Started

### Prerequisites

-   Docker
-   Docker Compose

### Docker Deployment

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd smartchoices-weather-api
   ```

2. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

3. Add your OpenWeatherMap API key to the `.env` file:

   ```
   OPENWEATHERMAP_API_KEY=your_api_key
   ```

4. Build and run the application using Docker Compose:

   ```bash
   docker-compose up --build
   ```

5. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

## Caching Strategy

The service utilizes Redis for caching weather and forecast data.

-   Weather data is cached for 5 minutes (300 seconds).
-   Forecast data is cached for 10 minutes (600 seconds).

## Environment Variables

### Backend:
-   `OPENWEATHERMAP_API_KEY`: Your OpenWeatherMap API key (required).
-   `REDIS_HOST`: Redis hostname (default: `redis`).
-   `REDIS_PORT`: Redis port (default: `6379`).

### Frontend:
-   `NEXT_PUBLIC_API_BASE_URL`: URL of the backend API (default in Docker: `http://backend:8000`)
