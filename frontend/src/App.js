import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/weather?city=${city}`);
      setWeather(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>🌤️ Live Weather App</h1>
        
        <form onSubmit={fetchWeather} className="search-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Searching...' : 'Get Weather'}
          </button>
        </form>

        {error && (
          <div className="error">
            ❌ {error}
          </div>
        )}

        {weather && (
          <div className="weather-card">
            <div className="weather-header">
              <h2>{weather.city}, {weather.country}</h2>
              {weather.icon && (
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                  alt={weather.description}
                  className="weather-icon"
                />
              )}
            </div>
            
            <div className="weather-main">
              <div className="temperature">{weather.temperature}°C</div>
              <div className="description">
                {weather.description}
              </div>
            </div>

            <div className="weather-details">
              <div className="detail-item">
                <span className="label">Feels like:</span>
                <span className="value">{weather.feels_like}°C</span>
              </div>
              <div className="detail-item">
                <span className="label">Humidity:</span>
                <span className="value">{weather.humidity}%</span>
              </div>
              <div className="detail-item">
                <span className="label">Wind Speed:</span>
                <span className="value">{weather.windSpeed} m/s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
