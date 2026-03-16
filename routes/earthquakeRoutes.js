const express = require('express');
const router = express.Router();
const axios = require('axios');
const Disaster = require('../models/Disaster');

// GET /api/earthquakes/live - Fetch live from USGS
router.get('/live', async (req, res) => {
  try {
    const { minmagnitude = 2.5, limit = 50 } = req.query;

    const response = await axios.get(`https://earthquake.usgs.gov/fdsnws/event/1/query`, {
      params: {
        format: 'geojson',
        minmagnitude,
        limit,
        orderby: 'time',
        // Focus on South Asia / India region
        minlatitude: 6,
        maxlatitude: 38,
        minlongitude: 68,
        maxlongitude: 98
      }
    });

    const features = response.data.features;
    const earthquakes = features.map(f => ({
      id: f.id,
      title: f.properties.title,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time),
      depth: f.geometry.coordinates[2],
      coordinates: f.geometry.coordinates,
      status: f.properties.status,
      tsunami: f.properties.tsunami,
      url: f.properties.url
    }));

    res.json({ success: true, count: earthquakes.length, earthquakes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'USGS data unavailable', error: error.message });
  }
});

// GET /api/earthquakes/recent - From our DB (synced)
router.get('/recent', async (req, res) => {
  try {
    const earthquakes = await Disaster.find({ type: 'earthquake', source: 'usgs' })
      .sort({ startedAt: -1 })
      .limit(30);
    res.json({ success: true, earthquakes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/earthquakes/significant - Magnitude >= 5
router.get('/significant', async (req, res) => {
  try {
    const response = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
      params: {
        format: 'geojson',
        minmagnitude: 5.0,
        limit: 20,
        orderby: 'time'
      }
    });

    const earthquakes = response.data.features.map(f => ({
      id: f.id,
      title: f.properties.title,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time),
      depth: f.geometry.coordinates[2],
      coordinates: f.geometry.coordinates,
      tsunami: f.properties.tsunami
    }));

    res.json({ success: true, earthquakes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Data unavailable', error: error.message });
  }
});

module.exports = router;
