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

// FIXED CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://68fb3a6e21a33dba66026d16--vineetweather.netlify.app',
    'https://vineetweather.netlify.app',
    'https://*.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Request logging
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
    endpoints: [
      'GET /api/health',
      'GET /api/weather?city=London',
      'GET /api/forecast?city=London', 
      'GET /api/location?lat=40.7128&lon=-74.0060',
      'GET /api/suggestions?query=london'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Weather API is running!',
    timestamp: new Date().toISOString(),
    apiKey: API_KEY ? 'Configured' : 'Missing'
  });
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    
    if (!city && (!lat || !lon)) {
      return res.status(400).json({ error: 'Provide city name or coordinates' });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }

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

    res.json(weatherData);
    
  } catch (error) {
    console.error('Weather API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    } else if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Invalid API Key' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Other endpoints (forecast, location, suggestions) remain the same
app.get('/api/forecast', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url);
    
    const forecastData = {
      city: response.data.city.name,
      country: response.data.city.country,
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
    console.error('Forecast API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

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
      state: response.data[0].state
    });
    
  } catch (error) {
    console.error('Geocoding API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

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
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔑 API Key: ${API_KEY ? '✅ Loaded' : '❌ MISSING'}`);
});

module.exports = app;