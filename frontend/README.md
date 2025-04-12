# Smart Choices Weather App Frontend

This is the frontend for the Smart Choices Weather App, a Next.js application that provides accurate, block-level weather information.

## Features

- **High-Precision Location**: Uses the browser's Geolocation API with `enableHighAccuracy: true` to provide block-level weather data
- **Fallback Options**: Falls back to city-level data when precise location is unavailable
- **Location Verification**: Validates location data using GPS accuracy checking
- **Unit Customization**: Toggle between metric (°C) and imperial (°F) units
- **Privacy Controls**: Users can choose between precise and general location data
- **Responsive Design**: Fully responsive UI across all devices
- **Error Handling**: Robust error states and user-friendly messages

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A running instance of the Smart Choices Weather API backend

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```
4. Configure the environment variables:
   Create a `.env.local` file in the root of the frontend directory with:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
   (Adjust the URL to match your backend API location)

5. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app

## Project Structure

- `src/app`: Main application code including page components
- `src/components`: Reusable UI components
- `src/contexts`: React contexts (LocationContext)
- `src/hooks`: Custom React hooks (useWeather)
- `src/services`: API clients and services
- `src/types`: TypeScript types and interfaces

## Architecture

This project follows the architecture described in the [ARCHITECTURE.md](../ARCHITECTURE.md) document.

## Important Notes

- **Location Permissions**: The app requires location permissions from the browser to function properly with high-precision
- **API Compatibility**: The frontend expects the Smart Choices Weather API backend to be running

## Future Enhancements

- Offline support via service workers
- Additional weather data visualizations
- Performance optimization and code splitting
- Enhanced location verification
