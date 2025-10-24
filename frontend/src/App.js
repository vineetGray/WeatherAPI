import React, { useState, useEffect } from 'react';
import axios from 'axios';
import countriesData from './locate.json';
import './App.css';

// Try these API endpoints - remove /api if it doesn't work
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://weatherapi-t7rv.onrender.com/api';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Country dropdown states
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [activeTab, setActiveTab] = useState('search');

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

  // Country dropdown handlers
  const handleCountryChange = (e) => {
    const country = countriesData.find((c) => c.name === e.target.value);
    setSelectedCountry(e.target.value);
    setStates(country?.states || []);
    setSelectedState('');
    setCities([]);
    setSelectedCity('');
  };

  const handleStateChange = (e) => {
    const state = states.find((s) => s.name === e.target.value);
    setSelectedState(e.target.value);
    setCities(state?.cities || []);
    setSelectedCity('');
  };

  const handleCityChange = (e) => setSelectedCity(e.target.value);

  const fetchWeatherData = async (cityName) => {
    if (!cityName.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);
    setShowHistory(false);

    try {
      // Try different endpoint variations
      const endpoints = [
        `${API_BASE_URL}/weather?city=${encodeURIComponent(cityName)}`,
        `${API_BASE_URL}/api/weather?city=${encodeURIComponent(cityName)}`,
        `https://weatherapi-t7rv.onrender.com/weather?city=${encodeURIComponent(cityName)}`,
        `https://weatherapi-t7rv.onrender.com/api/weather?city=${encodeURIComponent(cityName)}`
      ];

      let response;
      let lastError;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          response = await axios.get(endpoint, { timeout: 10000 });
          
          // If we get a successful response, break the loop
          if (response.status === 200) {
            console.log('Success with endpoint:', endpoint);
            break;
          }
        } catch (err) {
          lastError = err;
          console.log('Endpoint failed:', endpoint, err.message);
          // Continue to next endpoint
        }
      }

      // If no endpoint worked, throw the last error
      if (!response) {
        throw lastError || new Error('All API endpoints failed');
      }

      // Check if response data is valid
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Handle different response formats
      let weatherData = response.data;
      
      // If it's OpenWeatherMap format (from previous backend)
      if (weatherData.weather && weatherData.main) {
        weatherData = {
          location: {
            city: weatherData.name,
            country: weatherData.sys?.country
          },
          current: {
            temperature: weatherData.main.temp,
            description: weatherData.weather[0]?.description,
            iconUrl: `https://openweathermap.org/img/wn/${weatherData.weather[0]?.icon}@2x.png`,
            feels_like: weatherData.main.feels_like,
            humidity: weatherData.main.humidity,
            wind: { speed: weatherData.wind.speed },
            pressure: weatherData.main.pressure
          }
        };
      }

      // Check if we have minimal required data
      if (!weatherData.location || !weatherData.current) {
        throw new Error('Invalid weather data format received');
      }

      setWeather(weatherData);

      // Add to search history
      const newSearch = {
        city: weatherData.location.city || cityName,
        country: weatherData.location.country || 'Unknown Country',
        temperature: weatherData.current.temperature ?? 'N/A',
        timestamp: new Date().toISOString(),
      };

      setSearchHistory(prev => {
        const filtered = prev.filter(item => 
          !(item.city === newSearch.city && item.country === newSearch.country)
        );
        return [newSearch, ...filtered].slice(0, 5);
      });

    } catch (err) {
      console.error('Weather fetch error:', err);
      
      let errorMessage = 'Failed to fetch weather data';
      
      if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        errorMessage = 'Network error: Please check your internet connection';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to weather service. Please try again later.';
      } else if (err.response?.status === 404) {
        errorMessage = `City "${cityName}" not found. Please check the spelling.`;
      } else if (err.response?.status === 500) {
        errorMessage = 'Weather service is temporarily unavailable.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWeatherData(city);
  };

  const handleDropdownSearch = (e) => {
    e.preventDefault();
    fetchWeatherData(selectedCity);
    setCity(selectedCity);
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

  const clearAll = () => {
    setCity('');
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');
    setStates([]);
    setCities([]);
    setWeather(null);
    setError('');
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
            {weather && (
              <button className="clear-btn" onClick={clearAll}>
                🔄 New Search
              </button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('search');
                clearAll();
              }}
            >
              🔍 Search City
            </button>
            <button
              className={`tab ${activeTab === 'dropdown' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('dropdown');
                clearAll();
              }}
            >
              📍 Select Location
            </button>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <section className="search-section">
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-container">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onFocus={() => setShowHistory(true)}
                    placeholder="Enter city name..."
                    className="search-input"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !city.trim()} className="search-button">
                    {loading ? '⏳' : '🔍'} Search
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
        )}

        {/* Dropdown Tab */}
        {activeTab === 'dropdown' && (
          <section className="dropdown-section">
            <form onSubmit={handleDropdownSearch} className="dropdown-form">
              <div className="dropdown-group">
                <div className="select-wrapper">
                  <select 
                    value={selectedCountry} 
                    onChange={handleCountryChange}
                    className="dropdown-select"
                    disabled={loading}
                  >
                    <option value="">Select Country</option>
                    {countriesData.map((country) => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select
                    value={selectedState}
                    onChange={handleStateChange}
                    disabled={!states.length || loading}
                    className="dropdown-select"
                  >
                    <option value="">Select State/Province</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select
                    value={selectedCity}
                    onChange={handleCityChange}
                    disabled={!cities.length || loading}
                    className="dropdown-select"
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="dropdown-search-btn"
                  disabled={!selectedCity || loading}
                >
                  {loading ? '⏳' : '🌤'} Get Weather
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <strong>{error}</strong>
                <br />
                <small>Try: London, New York, Tokyo, Paris, etc.</small>
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
                  {typeof weatherData.temperature === 'number' 
                    ? Math.round(weatherData.temperature) 
                    : weatherData.temperature
                  }°C
                </div>
              </div>
              
              <div className="weather-main">
                {weatherData.iconUrl && (
                  <img 
                    src={weatherData.iconUrl} 
                    alt={weatherData.description}
                    className="weather-icon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="weather-info">
                  <div className="weather-desc">{weatherData.description}</div>
                  <div className="feels-like">
                    Feels like {typeof weatherData.feels_like === 'number' 
                      ? Math.round(weatherData.feels_like) 
                      : weatherData.feels_like
                    }°C
                  </div>
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
            <p>Enter a city name or select from dropdown to get weather information</p>
          </div>
        )}

        {/* Footer */}
        <footer className="app-footer">
          <p>Powered by Weather API</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
