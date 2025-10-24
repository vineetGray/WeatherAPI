// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;
// const API_KEY = process.env.OPENWEATHER_API_KEY;





// // Debug: Check if API key is loaded
// console.log('🔑 API Key Status:', API_KEY ? 'Loaded' : 'MISSING!');
// if (!API_KEY) {
//   console.error('❌ ERROR: OPENWEATHER_API_KEY is not set in .env file');
// }

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Enhanced error logging middleware
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   next();
// });

// // Test endpoint with API key check
// app.get('/api/health', (req, res) => {
//   if (!API_KEY) {
//     return res.status(500).json({ 
//       error: 'API key not configured',
//       message: 'Check your .env file and restart server'
//     });
//   }
//   res.json({ 
//     message: 'Weather API is running!',
//     apiKey: API_KEY ? 'Configured' : 'Missing'
//   });
// });

// // Enhanced weather endpoint with better error handling
// app.get('/api/weather', async (req, res) => {
//   try {
//     const { city } = req.query;
    
//     console.log('🌍 Weather request for city:', city);
    
//     if (!city) {
//       return res.status(400).json({ error: 'City parameter is required' });
//     }

//     if (!API_KEY) {
//       console.error('❌ API Key missing in request');
//       return res.status(500).json({ 
//         error: 'Server configuration error',
//         details: 'OpenWeatherMap API key is not configured'
//       });
//     }

//     const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
//     console.log('🔗 API URL:', url.replace(API_KEY, 'HIDDEN_KEY'));

//     const response = await axios.get(url);
//     console.log('✅ API Response received');

//     const weatherData = {
//       city: response.data.name,
//       country: response.data.sys.country,
//       temperature: Math.round(response.data.main.temp),
//       feels_like: Math.round(response.data.main.feels_like),
//       humidity: response.data.main.humidity,
//       pressure: response.data.main.pressure,
//       description: response.data.weather[0].description,
//       icon: response.data.weather[0].icon,
//       iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
//       windSpeed: response.data.wind.speed,
//       visibility: response.data.visibility / 1000,
//       sunrise: response.data.sys.sunrise,
//       sunset: response.data.sys.sunset,
//       timezone: response.data.timezone
//     };

//     res.json(weatherData);
    
//   } catch (error) {
//     console.error('❌ Weather API Error:', error.response?.data || error.message);
    
//     if (error.response) {
//       // OpenWeatherMap API returned an error
//       const status = error.response.status;
//       const message = error.response.data?.message;
      
//       if (status === 401) {
//         return res.status(500).json({ 
//           error: 'Invalid API Key',
//           details: 'Your OpenWeatherMap API key is invalid or not activated',
//           solution: 'Check your API key and make sure your account is activated'
//         });
//       } else if (status === 404) {
//         return res.status(404).json({ error: 'City not found' });
//       } else if (status === 429) {
//         return res.status(429).json({ error: 'API rate limit exceeded' });
//       } else {
//         return res.status(status).json({ 
//           error: 'Weather API error',
//           details: message || 'Unknown error from OpenWeatherMap'
//         });
//       }
//     } else if (error.request) {
//       // Network error
//       return res.status(503).json({ 
//         error: 'Network error',
//         details: 'Cannot connect to OpenWeatherMap API'
//       });
//     } else {
//       // Other error
//       return res.status(500).json({ 
//         error: 'Server error',
//         details: error.message
//       });
//     }
//   }
// });

// // Simple forecast endpoint (remove complex logic for now)
// app.get('/api/forecast', async (req, res) => {
//   try {
//     const { city } = req.query;
    
//     if (!city) {
//       return res.status(400).json({ error: 'City parameter is required' });
//     }

//     if (!API_KEY) {
//       return res.status(500).json({ error: 'API key not configured' });
//     }

//     const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
//     const response = await axios.get(url);
    
//     // Simple forecast - just take first 5 entries
//     const forecastData = {
//       city: response.data.city.name,
//       country: response.data.city.country,
//       daily: response.data.list.slice(0, 5).map(item => ({
//         date: item.dt_txt,
//         temperature: Math.round(item.main.temp),
//         description: item.weather[0].description,
//         icon: item.weather[0].icon,
//         iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
//         humidity: item.main.humidity,
//         windSpeed: item.wind.speed
//       }))
//     };

//     res.json(forecastData);
    
//   } catch (error) {
//     console.error('Forecast API Error:', error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to fetch forecast data' });
//   }
// });

// // Simple location endpoint
// app.get('/api/location', async (req, res) => {
//   try {
//     const { lat, lon } = req.query;
    
//     if (!lat || !lon) {
//       return res.status(400).json({ error: 'Latitude and longitude are required' });
//     }

//     const response = await axios.get(
//       `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
//     );

//     if (response.data.length === 0) {
//       return res.status(404).json({ error: 'Location not found' });
//     }

//     res.json({
//       city: response.data[0].name,
//       country: response.data[0].country
//     });
    
//   } catch (error) {
//     console.error('Geocoding API Error:', error.message);
//     res.status(500).json({ error: 'Failed to fetch location data' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
//   console.log(`🔑 API Key: ${API_KEY ? '✅ Loaded' : '❌ MISSING'}`);
//   console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
// });




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
  console.error('❌ ERROR: OPENWEATHER_API_KEY is not set in environment variables');
}

// Enhanced CORS for production
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://vineetweather.netlify.app/'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🌤️ WeatherSphere API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      weather: '/api/weather?city=London',
      forecast: '/api/forecast?city=London',
      location: '/api/location?lat=40.7128&lon=-74.0060'
    },
    documentation: 'See /api/health for detailed API status'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Weather API is running smoothly!',
    timestamp: new Date().toISOString(),
    apiKey: API_KEY ? 'Configured ✅' : 'Missing ❌',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  if (!API_KEY) {
    healthStatus.status = 'WARNING';
    healthStatus.message = 'API is running but OpenWeatherMap API key is missing';
  }

  res.json(healthStatus);
});

// Enhanced weather endpoint with better error handling
app.get('/api/weather', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    
    console.log('🌍 Weather request for:', { city, lat, lon });
    
    if (!city && (!lat || !lon)) {
      return res.status(400).json({ 
        error: 'Location is required',
        details: 'Provide either city name or coordinates (lat, lon)'
      });
    }

    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'OpenWeatherMap API key is not configured'
      });
    }

    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }

    console.log('🔗 Calling OpenWeatherMap API');
    const response = await axios.get(url);

    const weatherData = {
      location: {
        city: response.data.name,
        country: response.data.sys.country,
        coordinates: {
          lat: response.data.coord.lat,
          lon: response.data.coord.lon
        }
      },
      current: {
        temperature: Math.round(response.data.main.temp),
        feels_like: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
        wind: {
          speed: response.data.wind.speed,
          deg: response.data.wind.deg
        },
        visibility: response.data.visibility / 1000,
        sunrise: response.data.sys.sunrise,
        sunset: response.data.sys.sunset,
        timezone: response.data.timezone
      }
    };

    console.log(`✅ Weather data fetched for ${weatherData.location.city}`);
    res.json(weatherData);
    
  } catch (error) {
    console.error('❌ Weather API Error:', error.response?.data || error.message);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
      
      if (status === 401) {
        return res.status(500).json({ 
          error: 'Invalid API Key',
          details: 'Your OpenWeatherMap API key is invalid or not activated',
          solution: 'Check your API key in environment variables'
        });
      } else if (status === 404) {
        return res.status(404).json({ 
          error: 'City not found',
          details: `We couldn't find weather data for "${req.query.city}"`
        });
      } else if (status === 429) {
        return res.status(429).json({ 
          error: 'API rate limit exceeded',
          details: 'Too many requests to OpenWeatherMap API'
        });
      } else {
        return res.status(status).json({ 
          error: 'Weather API error',
          details: message || 'Unknown error from OpenWeatherMap'
        });
      }
    } else if (error.request) {
      return res.status(503).json({ 
        error: 'Network error',
        details: 'Cannot connect to OpenWeatherMap API'
      });
    } else {
      return res.status(500).json({ 
        error: 'Server error',
        details: error.message
      });
    }
  }
});

// Forecast endpoint
app.get('/api/forecast', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    
    if (!city && (!lat || !lon)) {
      return res.status(400).json({ error: 'Location is required' });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }

    const response = await axios.get(url);
    
    const forecastData = {
      location: {
        city: response.data.city.name,
        country: response.data.city.country
      },
      daily: response.data.list.slice(0, 5).map(item => ({
        date: item.dt_txt,
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
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

// Location endpoint
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
      country: response.data[0].country,
      state: response.data[0].state,
      displayName: `${response.data[0].name}, ${response.data[0].state ? response.data[0].state + ', ' : ''}${response.data[0].country}`
    });
    
  } catch (error) {
    console.error('Geocoding API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

// Suggestions endpoint
app.get('/api/suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const response = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );

    const suggestions = response.data.map(item => ({
      name: item.name,
      country: item.country,
      state: item.state,
      lat: item.lat,
      lon: item.lon,
      displayName: `${item.name}, ${item.state ? item.state + ', ' : ''}${item.country}`
    }));

    res.json(suggestions);

  } catch (error) {
    console.error('Suggestions API error:', error.message);
    res.json([]);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The route ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on our end'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🌤️  WeatherSphere API Server Started!');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port: ${PORT}`);
  console.log(`🔑 API Key: ${API_KEY ? '✅ Loaded' : '❌ MISSING'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏠 Local URL: http://localhost:${PORT}`);
  console.log('='.repeat(50));
  
  if (!API_KEY) {
    console.log('\n❌ IMPORTANT: OpenWeatherMap API key is missing!');
    console.log('   Add OPENWEATHER_API_KEY to your environment variables');
    console.log('   Get your API key from: https://openweathermap.org/api\n');
  }
});

module.exports = app;