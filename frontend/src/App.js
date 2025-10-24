import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://weatherapi-t7rv.onrender.com/api';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('weatherSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search history
  useEffect(() => {
    localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const fetchWeatherData = async (cityName) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setShowHistory(false);

    try {
      const url = `${API_BASE_URL}/weather?city=${encodeURIComponent(cityName)}`;
      const response = await axios.get(url);
      
      if (!response.data || !response.data.location || !response.data.current) {
        throw new Error('Invalid weather data received from server');
      }

      setWeather(response.data);

      // Add to search history
      if (response.data && response.data.location) {
        const newSearch = {
          city: response.data.location.city || 'Unknown City',
          country: response.data.location.country || 'Unknown Country',
          temperature: response.data.current?.temperature || 'N/A',
          timestamp: new Date().toISOString(),
        };

        setSearchHistory(prev => {
          const filtered = prev.filter(item => 
            !(item.city === newSearch.city && item.country === newSearch.country)
          );
          return [newSearch, ...filtered].slice(0, 5);
        });
      }

    } catch (err) {
      console.error('Weather fetch error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch weather data';
      
      if (err.response?.data?.details) {
        setError(`${err.response.data.error}: ${err.response.data.details}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    fetchWeatherData(city);
  };

  const handleClearError = () => {
    setError('');
  };

  const handleSelectFromHistory = (selectedCity) => {
    setCity(selectedCity);
    setShowHistory(false);
    fetchWeatherData(selectedCity);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setShowHistory(false);
  };

  // Safe weather data access
  const getWeatherDisplayData = () => {
    if (!weather) return null;
    
    return {
      city: weather.location?.city || 'Unknown City',
      country: weather.location?.country || 'Unknown Country',
      temperature: weather.current?.temperature ?? 'N/A',
      description: weather.current?.description || 'No description available',
      iconUrl: weather.current?.iconUrl || '',
      feels_like: weather.current?.feels_like ?? 'N/A',
      humidity: weather.current?.humidity ?? 'N/A',
      windSpeed: weather.current?.wind?.speed ?? 'N/A',
      pressure: weather.current?.pressure ?? 'N/A'
    };
  };

  const weatherData = getWeatherDisplayData();

  return (
    <div className="App">
      <div className="container">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1>🌤️ WeatherAPP</h1>
            <p>Get real-time weather information</p>
          </div>
        </header>

        {/* Search Section */}
        <section className="search-section">
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  placeholder="Enter city name"
                  className="search-input"
                />
                <button type="submit" disabled={loading} className="search-button">
                  {loading ? '⏳' : '🔍'}
                </button>
              </div>
            </form>

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="search-history-dropdown">
                <div className="history-header">
                  <span>Recent Searches</span>
                  <button onClick={clearSearchHistory} className="clear-history-btn">
                    Clear All
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="history-item"
                    onClick={() => handleSelectFromHistory(item.city)}
                  >
                    <div className="history-city">
                      <span className="city-name">{item.city}</span>
                      <span className="country-name">{item.country}</span>
                    </div>
                    <div className="history-temp">{item.temperature}°C</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <strong>{error}</strong>
              </div>
              <button 
                onClick={handleClearError} 
                className="error-close"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="weather-loader">
              <div className="cloud"></div>
              <div className="rain">
                <div className="drop"></div>
                <div className="drop"></div>
                <div className="drop"></div>
              </div>
            </div>
            <p>Searching for weather data...</p>
          </div>
        )}

        {/* Weather Results */}
        {weather && weatherData && !loading && (
          <div className="weather-results">
            <div className="weather-card">
              <div className="weather-header">
                <div className="location-info">
                  <h2>{weatherData.city}</h2>
                  <p className="country">{weatherData.country}</p>
                </div>
                <div className="current-temp">
                  {weatherData.temperature}°C
                </div>
              </div>
              
              <div className="weather-main">
                {weatherData.iconUrl && (
                  <img 
                    src={weatherData.iconUrl} 
                    alt={weatherData.description}
                    className="weather-icon"
                  />
                )}
                <div className="weather-info">
                  <div className="weather-desc">{weatherData.description}</div>
                  <div className="feels-like">Feels like {weatherData.feels_like}°C</div>
                </div>
              </div>

              <div className="weather-stats">
                <div className="stat-item">
                  <div className="stat-icon">💧</div>
                  <div className="stat-info">
                    <div className="stat-value">{weatherData.humidity}%</div>
                    <div className="stat-label">Humidity</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">💨</div>
                  <div className="stat-info">
                    <div className="stat-value">{weatherData.windSpeed} m/s</div>
                    <div className="stat-label">Wind</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🔽</div>
                  <div className="stat-info">
                    <div className="stat-value">{weatherData.pressure} hPa</div>
                    <div className="stat-label">Pressure</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!weather && !loading && !error && (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="sun"></div>
              <div className="cloud"></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;