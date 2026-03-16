const mongoose = require('mongoose');

const disasterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Disaster title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'earthquake', 'flood', 'cyclone', 'wildfire', 'landslide',
      'tsunami', 'drought', 'heatwave', 'storm', 'volcano',
      'chemical', 'industrial', 'other'
    ]
  },
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true,
    default: 'moderate'
  },
  status: {
    type: String,
    enum: ['active', 'monitoring', 'resolved', 'upcoming'],
    default: 'active'
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    district: String
  },
  affectedRadius: {
    type: Number, // in kilometers
    default: 10
  },
  magnitude: {
    type: Number, // for earthquakes
    default: null
  },
  depth: {
    type: Number, // for earthquakes, in km
    default: null
  },
  affectedPeople: {
    type: Number,
    default: 0
  },
  casualties: {
    deaths: { type: Number, default: 0 },
    injured: { type: Number, default: 0 },
    missing: { type: Number, default: 0 }
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  source: {
    type: String,
    enum: ['usgs', 'nasa', 'government', 'user_report', 'admin', 'openweather'],
    default: 'admin'
  },
  externalId: {
    type: String, // ID from external APIs
    default: null
  },
  governmentAlert: {
    isActive: { type: Boolean, default: false },
    message: String,
    issuedBy: String,
    issuedAt: Date
  },
  translations: {
    hi: {
      title: String,
      description: String
    },
    mr: {
      title: String,
      description: String
    }
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  updates: [{
    message: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedAt: { type: Date, default: Date.now }
  }],
  evacuationZones: [{
    name: String,
    coordinates: [[Number]],
    status: { type: String, enum: ['mandatory', 'voluntary', 'lifted'] }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
}, {
  timestamps: true
});

// ─── Geospatial Index ─────────────────────────────────────────────────────
disasterSchema.index({ location: '2dsphere' });
disasterSchema.index({ type: 1, severity: 1, status: 1 });
disasterSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Disaster', disasterSchema);
