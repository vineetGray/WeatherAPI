// import React, { useState } from 'react';
// import axios from 'axios';
// import './App.css';

// const API_BASE_URL = process.env.REACT_APP_API_URL||'http://localhost:5000/api';

// function App() {
//   const [city, setCity] = useState('');
//   const [weather, setWeather] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const fetchWeather = async (e) => {
//     e.preventDefault();
//     if (!city.trim()) return;

//     setLoading(true);
//     setError('');
//     setWeather(null);

//     try {
//       const response = await axios.get(`${API_BASE_URL}/weather?city=${city}`);
//       setWeather(response.data);
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to fetch weather data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="App">
//       <div className="container">
//         <h1>🌤️ Live Weather App</h1>
        
//         <form onSubmit={fetchWeather} className="search-form">
//           <input
//             type="text"
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             placeholder="Enter city name..."
//             className="search-input"
//           />
//           <button type="submit" disabled={loading} className="search-button">
//             {loading ? 'Searching...' : 'Get Weather'}
//           </button>
//         </form>

//         {error && (
//           <div className="error">
//             ❌ {error}
//           </div>
//         )}

//         {weather && (
//           <div className="weather-card">
//             <div className="weather-header">
//               <h2>{weather.city}, {weather.country}</h2>
//               {weather.icon && (
//                 <img 
//                   src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
//                   alt={weather.description}
//                   className="weather-icon"
//                 />
//               )}
//             </div>
            
//             <div className="weather-main">
//               <div className="temperature">{weather.temperature}°C</div>
//               <div className="description">
//                 {weather.description}
//               </div>
//             </div>

//             <div className="weather-details">
//               <div className="detail-item">
//                 <span className="label">Feels like:</span>
//                 <span className="value">{weather.feels_like}°C</span>
//               </div>
//               <div className="detail-item">
//                 <span className="label">Humidity:</span>
//                 <span className="value">{weather.humidity}%</span>
//               </div>
//               <div className="detail-item">
//                 <span className="label">Wind Speed:</span>
//                 <span className="value">{weather.windSpeed} m/s</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SmartSearch from './components/SmartSearch';
import './App.css';

const API_BASE_URL = 'https://weatherapi-t7rv.onrender.com/api'; // FIXED URL

function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

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

  const fetchWeatherData = async (location) => {
    setLoading(true);
    setError('');
    setWeather(null);

    try {
      let url;
      if (location.lat && location.lon) {
        url = `${API_BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}`;
      } else {
        url = `${API_BASE_URL}/weather?city=${encodeURIComponent(location.name)}`;
      }

      const response = await axios.get(url);
      
      // Validate response structure
      if (!response.data || !response.data.location || !response.data.current) {
        throw new Error('Invalid weather data received from server');
      }

      setWeather(response.data);

      // Add to search history - safely access properties
      if (response.data && response.data.location) {
        const newSearch = {
          city: response.data.location.city || 'Unknown City',
          country: response.data.location.country || 'Unknown Country',
          temperature: response.data.current?.temperature || 'N/A',
          timestamp: new Date().toISOString(),
          coordinates: response.data.location.coordinates || {}
        };

        setSearchHistory(prev => {
          const filtered = prev.filter(item => 
            !(item.city === newSearch.city && item.country === newSearch.country)
          );
          return [newSearch, ...filtered].slice(0, 8);
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

  const handleLocationSelect = (location) => {
    if (!location || (!location.name && !location.lat)) {
      setError('Invalid location selected');
      return;
    }
    fetchWeatherData(location);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get location name from coordinates
          const locationResponse = await axios.get(
            `${API_BASE_URL}/location?lat=${latitude}&lon=${longitude}`
          );
          
          const locationData = {
            ...locationResponse.data,
            lat: latitude,
            lon: longitude
          };
          
          fetchWeatherData(locationData);
          
        } catch (err) {
          // If reverse geocoding fails, use coordinates directly
          const locationData = { lat: latitude, lon: longitude };
          fetchWeatherData(locationData);
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    );
  };

  const handleClearError = () => {
    setError('');
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
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
            <div className="header-title">
              <h1>🌤️ WeatherSphere</h1>
              <p>Smart weather search with location suggestions</p>
            </div>
            <button 
              onClick={handleGeolocation}
              className="location-btn"
              disabled={loading}
              title="Use my current location"
            >
              📍 Current Location
            </button>
          </div>
        </header>

        {/* Smart Search Section */}
        <section className="search-section">
          <SmartSearch 
            onLocationSelect={handleLocationSelect}
            loading={loading}
          />
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
            <div className="loading-spinner"></div>
            <p>Searching for weather data...</p>
          </div>
        )}

        {/* Weather Results */}
        {weather && weatherData && !loading && (
          <div className="weather-results">
            <div className="weather-card">
              <div className="weather-header">
                <h2>{weatherData.city}, {weatherData.country}</h2>
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
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="weather-desc">
                  {weatherData.description}
                </div>
              </div>

              <div className="weather-details">
                <div className="detail-item">
                  <span>Feels like</span>
                  <span>{weatherData.feels_like}°C</span>
                </div>
                <div className="detail-item">
                  <span>Humidity</span>
                  <span>{weatherData.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span>Wind</span>
                  <span>{weatherData.windSpeed} m/s</span>
                </div>
                <div className="detail-item">
                  <span>Pressure</span>
                  <span>{weatherData.pressure} hPa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && !weather && !loading && (
          <div className="search-history">
            <h3>Recent Searches</h3>
            <div className="history-list">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="history-item"
                  onClick={() => handleLocationSelect({ name: item.city })}
                >
                  <span className="history-city">{item.city}, {item.country}</span>
                  <span className="history-temp">{item.temperature}°C</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleClearHistory}
              className="clear-history"
            >
              Clear History
            </button>
          </div>
        )}

        {/* Empty State */}
        {!weather && !loading && !error && searchHistory.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Start Searching</h3>
            <p>Use the search above to find weather for any location worldwide</p>
            <div className="search-tips">
              <div className="tip">💡 Try searching for cities, countries, or coordinates</div>
              <div className="tip">📍 Use the location button for your current weather</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="app-footer">
          <p>Powered by OpenWeatherMap • Built with React & Node.js</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
