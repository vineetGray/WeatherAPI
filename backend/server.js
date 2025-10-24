const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Debug: Check if API key is loaded
console.log('🔑 API Key Status:', API_KEY ? 'Loaded' : 'MISSING!');
if (!API_KEY) {
  console.error('❌ ERROR: OPENWEATHER_API_KEY is not set in .env file');
}

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced error logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test endpoint with API key check
app.get('/api/health', (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Check your .env file and restart server'
    });
  }
  res.json({ 
    message: 'Weather API is running!',
    apiKey: API_KEY ? 'Configured' : 'Missing'
  });
});

// Enhanced weather endpoint with better error handling
app.get('/api/weather', async (req, res) => {
  try {
    const { city } = req.query;
    
    console.log('🌍 Weather request for city:', city);
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    if (!API_KEY) {
      console.error('❌ API Key missing in request');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'OpenWeatherMap API key is not configured'
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    console.log('🔗 API URL:', url.replace(API_KEY, 'HIDDEN_KEY'));

    const response = await axios.get(url);
    console.log('✅ API Response received');

    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temperature: Math.round(response.data.main.temp),
      feels_like: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      pressure: response.data.main.pressure,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
      windSpeed: response.data.wind.speed,
      visibility: response.data.visibility / 1000,
      sunrise: response.data.sys.sunrise,
      sunset: response.data.sys.sunset,
      timezone: response.data.timezone
    };

    res.json(weatherData);
    
  } catch (error) {
    console.error('❌ Weather API Error:', error.response?.data || error.message);
    
    if (error.response) {
      // OpenWeatherMap API returned an error
      const status = error.response.status;
      const message = error.response.data?.message;
      
      if (status === 401) {
        return res.status(500).json({ 
          error: 'Invalid API Key',
          details: 'Your OpenWeatherMap API key is invalid or not activated',
          solution: 'Check your API key and make sure your account is activated'
        });
      } else if (status === 404) {
        return res.status(404).json({ error: 'City not found' });
      } else if (status === 429) {
        return res.status(429).json({ error: 'API rate limit exceeded' });
      } else {
        return res.status(status).json({ 
          error: 'Weather API error',
          details: message || 'Unknown error from OpenWeatherMap'
        });
      }
    } else if (error.request) {
      // Network error
      return res.status(503).json({ 
        error: 'Network error',
        details: 'Cannot connect to OpenWeatherMap API'
      });
    } else {
      // Other error
      return res.status(500).json({ 
        error: 'Server error',
        details: error.message
      });
    }
  }
});

// Simple forecast endpoint (remove complex logic for now)
app.get('/api/forecast', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
    const response = await axios.get(url);
    
    // Simple forecast - just take first 5 entries
    const forecastData = {
      city: response.data.city.name,
      country: response.data.city.country,
      daily: response.data.list.slice(0, 5).map(item => ({
        date: item.dt_txt,
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed
      }))
    };

    res.json(forecastData);
    
  } catch (error) {
    console.error('Forecast API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

// Simple location endpoint
app.get('/api/location', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );

    if (response.data.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({
      city: response.data[0].name,
      country: response.data[0].country
    });
    
  } catch (error) {
    console.error('Geocoding API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${API_KEY ? '✅ Loaded' : '❌ MISSING'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});


// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;
// const API_KEY = process.env.OPENWEATHER_API_KEY;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Debug: Check if API key is loaded
// console.log('🔑 API Key Status:', API_KEY ? 'Loaded' : 'MISSING!');
// if (!API_KEY) {
//   console.error('❌ ERROR: OPENWEATHER_API_KEY is not set in .env file');
// }

// // Request logging middleware
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   next();
// });

// // Helper function to get wind direction
// const getWindDirection = (deg) => {
//   const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
//   return directions[Math.round(deg / 22.5) % 16];
// };

// // Helper function to calculate dew point
// const calculateDewPoint = (temp, humidity) => {
//   // More accurate dew point calculation
//   const a = 17.27;
//   const b = 237.7;
//   const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
//   return (b * alpha) / (a - alpha);
// };

// // Helper function to get weather icon URL
// const getWeatherIcon = (iconCode, size = '2x') => {
//   return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
// };

// // Helper function to get AQI description (mock data)
// const getAQIDescription = (aqi) => {
//   const levels = [
//     { range: [0, 50], level: 'Good', color: '#00e400', description: 'Air quality is satisfactory' },
//     { range: [51, 100], level: 'Moderate', color: '#ffff00', description: 'Air quality is acceptable' },
//     { range: [101, 150], level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Members of sensitive groups may experience health effects' },
//     { range: [151, 200], level: 'Unhealthy', color: '#ff0000', description: 'Everyone may begin to experience health effects' },
//     { range: [201, 300], level: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert: everyone may experience more serious health effects' },
//     { range: [301, 500], level: 'Hazardous', color: '#7e0023', description: 'Health warning of emergency conditions' }
//   ];
  
//   return levels.find(level => aqi >= level.range[0] && aqi <= level.range[1]) || levels[0];
// };

// // Auto-suggestions endpoint
// app.get('/api/suggestions', async (req, res) => {
//   try {
//     const { query } = req.query;
    
//     if (!query || query.length < 2) {
//       return res.json([]);
//     }

//     console.log('🔍 Fetching suggestions for:', query);

//     const response = await axios.get(
//       `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=8&appid=${API_KEY}`
//     );

//     const suggestions = response.data.map(item => ({
//       name: item.name,
//       country: item.country,
//       state: item.state,
//       lat: item.lat,
//       lon: item.lon,
//       displayName: `${item.name}, ${item.state ? item.state + ', ' : ''}${item.country}`
//     }));

//     // Remove duplicates based on name and country
//     const uniqueSuggestions = suggestions.filter((item, index, self) =>
//       index === self.findIndex(t => 
//         t.name === item.name && t.country === item.country
//       )
//     );

//     console.log(`✅ Found ${uniqueSuggestions.length} suggestions`);
//     res.json(uniqueSuggestions);

//   } catch (error) {
//     console.error('❌ Suggestions API error:', error.message);
    
//     if (error.response?.status === 401) {
//       return res.status(500).json({ error: 'Invalid API key for suggestions' });
//     }
    
//     // Return mock suggestions if API fails
//     const mockSuggestions = [
//       { name: "London", country: "GB", state: "England", lat: 51.5074, lon: -0.1278, displayName: "London, England, GB" },
//       { name: "New York", country: "US", state: "NY", lat: 40.7128, lon: -74.0060, displayName: "New York, NY, US" },
//       { name: "Tokyo", country: "JP", state: "", lat: 35.6762, lon: 139.6503, displayName: "Tokyo, JP" },
//       { name: "Paris", country: "FR", state: "Île-de-France", lat: 48.8566, lon: 2.3522, displayName: "Paris, Île-de-France, FR" }
//     ].filter(item => 
//       item.name.toLowerCase().includes(query.toLowerCase()) ||
//       item.displayName.toLowerCase().includes(query.toLowerCase())
//     );
    
//     res.json(mockSuggestions);
//   }
// });

// // Enhanced weather endpoint with hourly and daily forecast
// app.get('/api/weather', async (req, res) => {
//   try {
//     const { city, lat, lon, units = 'metric' } = req.query;
    
//     if (!city && (!lat || !lon)) {
//       return res.status(400).json({ 
//         error: 'Location is required',
//         details: 'Provide either city name or coordinates (lat, lon)'
//       });
//     }

//     console.log(`🌤️ Fetching weather for: ${city || `${lat},${lon}`}`);

//     let weatherUrl, forecastUrl;
    
//     if (city) {
//       weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${units}`;
//       forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${units}`;
//     } else {
//       weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
//       forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
//     }

//     const [weatherResponse, forecastResponse] = await Promise.all([
//       axios.get(weatherUrl),
//       axios.get(forecastUrl)
//     ]);

//     // Process hourly data (24 hours - 8 intervals of 3 hours)
//     const hourlyForecast = forecastResponse.data.list.slice(0, 8).map(item => {
//       const time = new Date(item.dt * 1000);
//       return {
//         time: time,
//         timestamp: item.dt,
//         temperature: Math.round(item.main.temp),
//         feels_like: Math.round(item.main.feels_like),
//         humidity: item.main.humidity,
//         description: item.weather[0].description,
//         icon: item.weather[0].icon,
//         iconUrl: getWeatherIcon(item.weather[0].icon),
//         windSpeed: item.wind.speed,
//         windDirection: getWindDirection(item.wind.deg),
//         pressure: item.main.pressure,
//         pop: Math.round(item.pop * 100), // Probability of precipitation percentage
//         visibility: item.visibility / 1000,
//         cloudiness: item.clouds.all
//       };
//     });

//     // Process daily forecast (5 days)
//     const dailyForecast = [];
//     const processedDays = new Set();
    
//     forecastResponse.data.list.forEach(item => {
//       const date = new Date(item.dt * 1000).toDateString();
      
//       if (!processedDays.has(date) && dailyForecast.length < 5) {
//         processedDays.add(date);
        
//         // Find min/max temp for the day
//         const dayItems = forecastResponse.data.list.filter(dayItem => 
//           new Date(dayItem.dt * 1000).toDateString() === date
//         );
        
//         const temps = dayItems.map(dayItem => dayItem.main.temp);
//         const high = Math.round(Math.max(...temps));
//         const low = Math.round(Math.min(...temps));
        
//         dailyForecast.push({
//           date: item.dt_txt,
//           timestamp: item.dt,
//           day: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
//           shortDay: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
//           high: high,
//           low: low,
//           description: item.weather[0].description,
//           icon: item.weather[0].icon,
//           iconUrl: getWeatherIcon(item.weather[0].icon),
//           humidity: item.main.humidity,
//           windSpeed: item.wind.speed,
//           windDirection: getWindDirection(item.wind.deg),
//           pop: Math.round(item.pop * 100),
//           pressure: item.main.pressure,
//           sunrise: weatherResponse.data.sys.sunrise,
//           sunset: weatherResponse.data.sys.sunset
//         });
//       }
//     });

//     // Mock AQI data (since OpenWeatherMap AQI requires premium)
//     const mockAQI = Math.floor(Math.random() * 150) + 1;
//     const aqiInfo = getAQIDescription(mockAQI);

//     const weatherData = {
//       location: {
//         city: weatherResponse.data.name,
//         country: weatherResponse.data.sys.country,
//         coordinates: {
//           lat: weatherResponse.data.coord.lat,
//           lon: weatherResponse.data.coord.lon
//         },
//         timezone: weatherResponse.data.timezone,
//         timezoneOffset: weatherResponse.data.timezone
//       },
//       current: {
//         temperature: Math.round(weatherResponse.data.main.temp),
//         feels_like: Math.round(weatherResponse.data.main.feels_like),
//         humidity: weatherResponse.data.main.humidity,
//         pressure: weatherResponse.data.main.pressure,
//         description: weatherResponse.data.weather[0].description,
//         icon: weatherResponse.data.weather[0].icon,
//         iconUrl: getWeatherIcon(weatherResponse.data.weather[0].icon, '4x'),
//         wind: {
//           speed: weatherResponse.data.wind.speed,
//           deg: weatherResponse.data.wind.deg,
//           direction: getWindDirection(weatherResponse.data.wind.deg)
//         },
//         visibility: weatherResponse.data.visibility / 1000,
//         sunrise: weatherResponse.data.sys.sunrise,
//         sunset: weatherResponse.data.sys.sunset,
//         timezone: weatherResponse.data.timezone,
//         uvIndex: Math.floor(Math.random() * 11), // Mock UV data
//         dewPoint: Math.round(calculateDewPoint(weatherResponse.data.main.temp, weatherResponse.data.main.humidity)),
//         cloudiness: weatherResponse.data.clouds.all,
//         aqi: {
//           value: mockAQI,
//           level: aqiInfo.level,
//           color: aqiInfo.color,
//           description: aqiInfo.description
//         }
//       },
//       hourly: hourlyForecast,
//       daily: dailyForecast,
//       units: {
//         temperature: units === 'metric' ? '°C' : '°F',
//         speed: units === 'metric' ? 'm/s' : 'mph',
//         distance: units === 'metric' ? 'km' : 'miles'
//       }
//     };

//     console.log(`✅ Weather data fetched successfully for ${weatherData.location.city}`);
//     res.json(weatherData);

//   } catch (error) {
//     console.error('❌ Weather API Error:', error.response?.data || error.message);
    
//     if (error.response) {
//       const status = error.response.status;
//       const message = error.response.data?.message;
      
//       if (status === 401) {
//         return res.status(500).json({ 
//           error: 'Invalid API Key',
//           details: 'Your OpenWeatherMap API key is invalid or not activated',
//           solution: 'Check your API key in .env file and make sure your account is activated'
//         });
//       } else if (status === 404) {
//         return res.status(404).json({ 
//           error: 'Location not found',
//           details: `We couldn't find weather data for "${city}"`,
//           solution: 'Check the spelling or try a different location'
//         });
//       } else if (status === 429) {
//         return res.status(429).json({ 
//           error: 'API rate limit exceeded',
//           details: 'Too many requests to OpenWeatherMap API',
//           solution: 'Wait a few minutes before trying again'
//         });
//       } else {
//         return res.status(status).json({ 
//           error: 'Weather API error',
//           details: message || 'Unknown error from OpenWeatherMap'
//         });
//       }
//     } else if (error.request) {
//       return res.status(503).json({ 
//         error: 'Network error',
//         details: 'Cannot connect to OpenWeatherMap API',
//         solution: 'Check your internet connection'
//       });
//     } else {
//       return res.status(500).json({ 
//         error: 'Server error',
//         details: error.message
//       });
//     }
//   }
// });

// // Reverse geocoding endpoint
// app.get('/api/location', async (req, res) => {
//   try {
//     const { lat, lon } = req.query;
    
//     if (!lat || !lon) {
//       return res.status(400).json({ 
//         error: 'Latitude and longitude are required',
//         example: '?lat=40.7128&lon=-74.0060'
//       });
//     }

//     console.log(`📍 Reverse geocoding for: ${lat}, ${lon}`);

//     const response = await axios.get(
//       `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
//     );

//     if (response.data.length === 0) {
//       return res.status(404).json({ 
//         error: 'Location not found',
//         details: 'No location found for the provided coordinates'
//       });
//     }

//     const locationData = {
//       city: response.data[0].name,
//       country: response.data[0].country,
//       state: response.data[0].state,
//       displayName: `${response.data[0].name}, ${response.data[0].state ? response.data[0].state + ', ' : ''}${response.data[0].country}`,
//       coordinates: {
//         lat: parseFloat(lat),
//         lon: parseFloat(lon)
//       }
//     };

//     console.log(`✅ Location found: ${locationData.displayName}`);
//     res.json(locationData);

//   } catch (error) {
//     console.error('❌ Geocoding API Error:', error.message);
    
//     // Return mock location data if API fails
//     const mockLocation = {
//       city: "Unknown Location",
//       country: "Unknown",
//       state: "",
//       displayName: "Unknown Location",
//       coordinates: {
//         lat: parseFloat(lat),
//         lon: parseFloat(lon)
//       }
//     };
    
//     res.json(mockLocation);
//   }
// });

// // Air Quality endpoint (mock data for free tier)
// app.get('/api/air-quality', async (req, res) => {
//   try {
//     const { lat, lon } = req.query;
    
//     if (!lat || !lon) {
//       return res.status(400).json({ error: 'Latitude and longitude are required' });
//     }

//     // Mock AQI data since OpenWeatherMap AQI requires premium subscription
//     const mockAQI = Math.floor(Math.random() * 300) + 1;
//     const aqiInfo = getAQIDescription(mockAQI);
    
//     const pollutants = {
//       co: (Math.random() * 5000).toFixed(2),
//       no: (Math.random() * 50).toFixed(2),
//       no2: (Math.random() * 100).toFixed(2),
//       o3: (Math.random() * 200).toFixed(2),
//       so2: (Math.random() * 50).toFixed(2),
//       pm2_5: (Math.random() * 100).toFixed(2),
//       pm10: (Math.random() * 150).toFixed(2),
//       nh3: (Math.random() * 30).toFixed(2)
//     };

//     const airQualityData = {
//       aqi: mockAQI,
//       level: aqiInfo.level,
//       color: aqiInfo.color,
//       description: aqiInfo.description,
//       pollutants: pollutants,
//       lastUpdated: new Date().toISOString(),
//       note: 'Mock data - AQI requires OpenWeatherMap premium subscription'
//     };

//     res.json(airQualityData);

//   } catch (error) {
//     console.error('Air Quality API Error:', error.message);
//     res.status(500).json({ error: 'Failed to fetch air quality data' });
//   }
// });

// // Health check endpoint with API key status
// app.get('/api/health', (req, res) => {
//   const healthStatus = {
//     status: 'OK',
//     message: 'Weather API is running smoothly!',
//     timestamp: new Date().toISOString(),
//     apiKey: API_KEY ? 'Configured ✅' : 'Missing ❌',
//     environment: process.env.NODE_ENV || 'development',
//     version: '1.0.0'
//   };

//   if (!API_KEY) {
//     healthStatus.status = 'WARNING';
//     healthStatus.message = 'API is running but OpenWeatherMap API key is missing';
//   }

//   res.json(healthStatus);
// });

// // Root endpoint
// app.get('/', (req, res) => {
//   res.json({
//     message: '🌤️ WeatherSphere API Server',
//     version: '1.0.0',
//     endpoints: {
//       health: '/api/health',
//       weather: '/api/weather?city=London',
//       suggestions: '/api/suggestions?query=lon',
//       location: '/api/location?lat=40.7128&lon=-74.0060',
//       airQuality: '/api/air-quality?lat=40.7128&lon=-74.0060'
//     },
//     documentation: 'See /api/health for API status'
//   });
// });

// // 404 handler for undefined routes
// app.use('*', (req, res) => {
//   res.status(404).json({
//     error: 'Endpoint not found',
//     message: `The route ${req.originalUrl} does not exist`,
//     availableEndpoints: [
//       'GET /api/health',
//       'GET /api/weather?city=London',
//       'GET /api/suggestions?query=lon',
//       'GET /api/location?lat=40.7128&lon=-74.0060'
//     ]
//   });
// });

// // Global error handler
// app.use((error, req, res, next) => {
//   console.error('🚨 Global Error Handler:', error);
//   res.status(500).json({
//     error: 'Internal server error',
//     message: 'Something went wrong on our end',
//     requestId: req.id || Date.now()
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log('\n' + '='.repeat(50));
//   console.log('🌤️  WeatherSphere API Server Started!');
//   console.log('='.repeat(50));
//   console.log(`✅ Server running on: http://localhost:${PORT}`);
//   console.log(`🔑 API Key: ${API_KEY ? '✅ Loaded' : '❌ MISSING - Check .env file'}`);
//   console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
//   console.log(`🔍 Suggestions: http://localhost:${PORT}/api/suggestions?query=london`);
//   console.log(`⛅ Weather: http://localhost:${PORT}/api/weather?city=London`);
//   console.log('='.repeat(50) + '\n');
  
//   if (!API_KEY) {
//     console.log('❌ IMPORTANT: OpenWeatherMap API key is missing!');
//     console.log('   Create a .env file with: OPENWEATHER_API_KEY=your_api_key_here');
//     console.log('   Get your API key from: https://openweathermap.org/api\n');
//   }
// });

// module.exports = app;