const axios = require('axios');
const Disaster = require('../models/Disaster');

const syncEarthquakes = async () => {
  try {
    const response = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
      params: {
        format: 'geojson',
        minmagnitude: 4.0,
        limit: 50,
        orderby: 'time',
        starttime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    });

    const features = response.data.features;
    let created = 0;

    for (const f of features) {
      const externalId = f.id;
      const existing = await Disaster.findOne({ externalId, source: 'usgs' });
      if (existing) continue;

      const mag = f.properties.mag;
      let severity = 'low';
      if (mag >= 7) severity = 'critical';
      else if (mag >= 6) severity = 'high';
      else if (mag >= 5) severity = 'moderate';

      await Disaster.create({
        title: f.properties.title,
        type: 'earthquake',
        severity,
        status: 'active',
        description: `Magnitude ${mag} earthquake recorded at depth ${f.geometry.coordinates[2]} km. Source: USGS`,
        location: {
          type: 'Point',
          coordinates: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
          address: f.properties.place
        },
        magnitude: mag,
        depth: f.geometry.coordinates[2],
        source: 'usgs',
        externalId,
        isVerified: true,
        startedAt: new Date(f.properties.time)
      });

      created++;
    }

    console.log(`✅ USGS Sync: ${created} new earthquakes added`);
  } catch (error) {
    console.error('❌ USGS Sync Error:', error.message);
  }
};

module.exports = { syncEarthquakes };
