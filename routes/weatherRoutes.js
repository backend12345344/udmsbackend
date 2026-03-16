const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/weather?lat=XX&lng=XX
router.get('/', async (req, res) => {
  try {
    const { lat, lng, city } = req.query;

    if (!process.env.OPENWEATHER_KEY) {
      return res.status(503).json({ success: false, message: 'Weather API key not configured' });
    }

    let url;
    if (lat && lng) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_KEY}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${process.env.OPENWEATHER_KEY}&units=metric`;
    } else {
      return res.status(400).json({ success: false, message: 'lat/lng or city required' });
    }

    const response = await axios.get(url);
    const data = response.data;

    res.json({
      success: true,
      weather: {
        city: data.name,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        windSpeed: data.wind.speed,
        visibility: data.visibility,
        pressure: data.main.pressure,
        condition: data.weather[0].main
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Weather data unavailable', error: error.message });
  }
});

// GET /api/weather/alerts?lat=XX&lng=XX
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_KEY}&exclude=minutely,hourly,daily`;
    const response = await axios.get(url);
    const alerts = response.data.alerts || [];

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Weather alerts unavailable', error: error.message });
  }
});

module.exports = router;
