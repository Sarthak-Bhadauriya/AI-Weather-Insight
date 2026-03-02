import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Weather.css'
import search_icon from '../assets/search.png'
import clear_icon from '../assets/clear.png'
import cloud_icon from '../assets/cloud.png'
import drizzle_icon from '../assets/drizzle.png'
import rain_icon from '../assets/rain.png'
import snow_icon from '../assets/snow.png'
import wind_icon from '../assets/wind.png'
import humidity_icon from '../assets/humidity.png'

const allIcons = {
  "01d": clear_icon,
  "01n": clear_icon,
  "02d": cloud_icon,
  "02n": cloud_icon,
  "03d": cloud_icon,
  "03n": cloud_icon,
  "04d": drizzle_icon,
  "04n": drizzle_icon,
  "09d": rain_icon,
  "09n": rain_icon,
  "10d": rain_icon,
  "10n": rain_icon,
  "13d": snow_icon,
  "13n": snow_icon,
};

const getFallbackTip = ({ temperature, humidity, windSpeed, location }) => {
  if (temperature >= 35) {
    return `In ${location}, it's very hot. Stay hydrated and avoid direct sun from 12 PM to 4 PM.`;
  }
  if (temperature <= 10) {
    return `In ${location}, weather is quite cold. Wear layered clothing and keep yourself warm outside.`;
  }
  if (humidity >= 80) {
    return `In ${location}, humidity is high. Keep light clothing and drink extra water.`;
  }
  if (windSpeed >= 12) {
    return `In ${location}, it's windy. Carry a light jacket and secure loose outdoor items.`;
  }
  return `In ${location}, weather looks comfortable right now. Great time for a short walk outside.`;
};

const getForecastLabel = (weatherCode) => {
  if (weatherCode === 0) return 'Clear';
  if ([1, 2, 3].includes(weatherCode)) return 'Cloudy';
  if ([45, 48].includes(weatherCode)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'Snow';
  if ([95, 96, 99].includes(weatherCode)) return 'Storm';
  return 'Weather';
};

const getForecastIcon = (weatherCode) => {
  if (weatherCode === 0) return clear_icon;
  if ([1, 2, 3, 45, 48].includes(weatherCode)) return cloud_icon;
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return drizzle_icon;
  if ([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode)) return rain_icon;
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return snow_icon;
  return clear_icon;
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState('Delhi');
  const [aiTip, setAiTip] = useState('Search a city to get an AI weather tip.');
  const [forecast, setForecast] = useState([]);
  const [hourlyByDate, setHourlyByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState('');

  const generateAiTip = useCallback(async (snapshot) => {
    const fallbackTip = getFallbackTip(snapshot);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      setAiTip(fallbackTip);
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          input: `You are a weather assistant. Give one short practical tip (max 25 words) for current weather.
City: ${snapshot.location}
Temperature: ${snapshot.temperature} C
Humidity: ${snapshot.humidity}%
Wind Speed: ${snapshot.windSpeed} km/h`,
        }),
      });

      if (!response.ok) {
        setAiTip(fallbackTip);
        return;
      }

      const data = await response.json();
      const aiText = data.output_text?.trim();
      setAiTip(aiText || fallbackTip);
    } catch (error) {
      console.error(error);
      setAiTip(fallbackTip);
    }
  }, []);

  const fetchSevenDayForecast = useCallback(async (lat, lon) => {
    try {
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m&timezone=auto&forecast_days=7`;
      const response = await fetch(forecastUrl);

      if (!response.ok) {
        setForecast([]);
        setHourlyByDate({});
        setSelectedDate('');
        return;
      }

      const data = await response.json();
      const daily = data.daily;
      const hourly = data.hourly;

      if (!daily?.time?.length) {
        setForecast([]);
        setHourlyByDate({});
        setSelectedDate('');
        return;
      }

      const nextDays = daily.time.map((date, index) => ({
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        max: Math.round(daily.temperature_2m_max[index]),
        min: Math.round(daily.temperature_2m_min[index]),
        condition: getForecastLabel(daily.weathercode[index]),
        icon: getForecastIcon(daily.weathercode[index]),
      }));

      const hourlyMap = {};
      if (hourly?.time?.length) {
        hourly.time.forEach((time, index) => {
          const dateKey = time.split('T')[0];
          if (!hourlyMap[dateKey]) {
            hourlyMap[dateKey] = [];
          }

          hourlyMap[dateKey].push({
            time: new Date(time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            temperature: Math.round(hourly.temperature_2m[index]),
            humidity: Math.round(hourly.relativehumidity_2m[index]),
            windSpeed: Math.round(hourly.windspeed_10m[index]),
            condition: getForecastLabel(hourly.weathercode[index]),
            icon: getForecastIcon(hourly.weathercode[index]),
          });
        });
      }

      setForecast(nextDays);
      setHourlyByDate(hourlyMap);
      setSelectedDate('');
    } catch (error) {
      console.error(error);
      setForecast([]);
      setHourlyByDate({});
      setSelectedDate('');
    }
  }, []);

  const search = useCallback(async (cityName) => {
    if (!cityName?.trim()) {
      return;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const icon = allIcons[data.weather[0].icon] || clear_icon;
      const snapshot = {
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        temperature: Math.floor(data.main.temp),
        location: data.name,
        icon
      };

      setWeatherData(snapshot);
      fetchSevenDayForecast(data.coord.lat, data.coord.lon);
      setAiTip('AI is analyzing current weather...');
      generateAiTip(snapshot);
    } catch (error) {
      console.error(error);
    }
  }, [fetchSevenDayForecast, generateAiTip]);

  const selectedDayLabel = useMemo(() => {
    return forecast.find((item) => item.date === selectedDate)?.day || '--';
  }, [forecast, selectedDate]);

  useEffect(() => {
    search('Delhi');
  }, [search]);

  return (
    <div className='Weather'>
      <div className="search-bar">
        <input
          type="text"
          placeholder='City'
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              search(city);
            }
          }}
        />
        <button type="button" onClick={() => search(city)}>
          <img src={search_icon} alt="" />
          <span>Search</span>
        </button>
      </div>

      <img src={weatherData?.icon || clear_icon} alt="" className='weather-icon' />
      <p className='temperature'>{weatherData?.temperature ?? '--'}</p>
      <p className='location'>{weatherData?.location ?? 'Search a city'}</p>

      <div className="weather-data">
        <div className="col">
          <img src={humidity_icon} alt="" />
          <div>
            <p>{weatherData?.humidity ?? '--'}%</p>
            <span>humidity</span>
          </div>
        </div>
        <div className="col">
          <img src={wind_icon} alt="" />
          <div>
            <p>{weatherData?.windSpeed ?? '--'} km/h</p>
            <span>wind Speed</span>
          </div>
        </div>
      </div>

      <div className="ai-card">
        <p className="ai-title">AI Weather Tip</p>
        <p className="ai-text">{aiTip}</p>
      </div>

      <div className="forecast-section">
        <p className="forecast-title">Next 7 Days</p>
        <div className="forecast-grid">
          {forecast.map((item) => (
            <button
              type="button"
              className={`forecast-card ${selectedDate === item.date ? 'active' : ''}`}
              key={item.date}
              onClick={() => setSelectedDate((prev) => (prev === item.date ? '' : item.date))}
            >
              <p className="forecast-day">{item.day}</p>
              <img className="forecast-icon" src={item.icon} alt={item.condition} />
              <p className="forecast-temp">{item.max}&deg; / {item.min}&deg;</p>
            </button>
          ))}
        </div>

        {selectedDate && (
          <div className="hourly-section">
            <p className="forecast-title">24 Hours ({selectedDayLabel})</p>
            <div className="hourly-grid">
              {(hourlyByDate[selectedDate] || []).map((hourData, index) => (
                <div className="hourly-card" key={`${selectedDate}-${index}`}>
                  <p className="hourly-time">{hourData.time}</p>
                  <img className="hourly-icon" src={hourData.icon} alt={hourData.condition} />
                  <p className="hourly-temp">{hourData.temperature}&deg;</p>
                  <p className="hourly-meta">Humidity {hourData.humidity}%</p>
                  <p className="hourly-meta">Wind {hourData.windSpeed} km/h</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Weather
