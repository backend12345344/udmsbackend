const axios = require('axios');
const Disaster = require('../models/Disaster');

const NASA_TYPE_MAP = {
  'wildfires': 'wildfire',
  'severeStorms': 'storm',
  'floods': 'flood',
  'landslides': 'landslide',
  'volcanoes': 'volcano',
  'seaLakeIce': 'other',
  'drought': 'drought'
};

const syncNASAEvents = async () => {
  try {
    const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
      params: {
        status: 'open',
        limit: 30,
        days: 7
      }
    });

    const events = response.data.events;
    let created = 0;

    for (const event of events) {
      const externalId = `nasa_${event.id}`;
      const existing = await Disaster.findOne({ externalId });
      if (existing) continue;

      const categoryId = event.categories?.[0]?.id;
      const disasterType = NASA_TYPE_MAP[categoryId] || 'other';

      const latestGeometry = event.geometry?.[0];
      if (!latestGeometry) continue;

      let coordinates;
      if (latestGeometry.type === 'Point') {
        coordinates = latestGeometry.coordinates;
      } else {
        continue; // Skip non-point geometries for now
      }

      await Disaster.create({
        title: event.title,
        type: disasterType,
        severity: 'moderate',
        status: 'active',
        description: `NASA EONET Event: ${event.title}. Category: ${event.categories?.[0]?.title}`,
        location: {
          type: 'Point',
          coordinates,
        },
        source: 'nasa',
        externalId,
        isVerified: true,
        startedAt: new Date(latestGeometry.date || Date.now())
      });

      created++;
    }

    console.log(`✅ NASA Sync: ${created} new events added`);
  } catch (error) {
    console.error('❌ NASA Sync Error:', error.message);
  }
};

module.exports = { syncNASAEvents };
