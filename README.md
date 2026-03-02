# Weather App

A simple React + Vite weather app that shows:

- Current weather by city
- 7-day forecast
- Hourly forecast (for selected day)
- AI weather tip (optional, via OpenAI API)

## Tech Stack

- React 19
- Vite
- OpenWeatherMap API (current weather)
- Open-Meteo API (7-day + hourly forecast)
- OpenAI Responses API (optional tip generation)

## Features

- Search weather by city name
- Displays temperature, humidity, and wind speed
- Weather icon mapping for current conditions
- Click any forecast day to view 24-hour breakdown
- Fallback local tip if OpenAI key is not configured

## Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_APP_ID=your_openweathermap_api_key
VITE_OPENAI_API_KEY=your_openai_api_key_optional
```

Notes:

- `VITE_APP_ID` is required for current weather search.
- `VITE_OPENAI_API_KEY` is optional. If missing, app shows built-in weather tips.

## Run Locally

```bash
npm install
npm run dev
```

App runs on the local Vite URL (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```text
src/
  assets/              # weather icons and UI assets
  components/
    Weather.jsx        # main weather logic and UI
    Weather.css        # component styling
  App.jsx
  main.jsx
```

## Author

- Sarthak Bhadauriya
- Full Stack Developer
