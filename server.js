require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const cron = require('node-cron');
const { syncEarthquakes } = require('./utils/earthquakeSync');
const { syncNASAEvents } = require('./utils/nasaSync');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ─── Static Files ──────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/disasters',    require('./routes/disasterRoutes'));
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/sos',          require('./routes/sosRoutes'));
app.use('/api/resources',    require('./routes/resourceRoutes'));
app.use('/api/reports',      require('./routes/reportRoutes'));
app.use('/api/alerts',       require('./routes/alertRoutes'));
app.use('/api/volunteers',   require('./routes/volunteerRoutes'));
app.use('/api/weather',      require('./routes/weatherRoutes'));
app.use('/api/earthquakes',  require('./routes/earthquakeRoutes'));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'UDMS API is running 🌍', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Cron Jobs (Auto-sync external APIs) ──────────────────────────────────
// Sync earthquakes every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('🔄 Syncing earthquakes from USGS...');
  await syncEarthquakes();
});

// Sync NASA disaster events every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('🔄 Syncing NASA EONET events...');
  await syncNASAEvents();
});

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 UDMS Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
