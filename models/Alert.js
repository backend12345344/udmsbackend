const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['warning', 'evacuation', 'shelter', 'all_clear', 'advisory', 'emergency'],
    default: 'warning'
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'moderate', 'high', 'critical'],
    default: 'moderate'
  },
  targetArea: {
    type: {
      type: String,
      enum: ['Point', 'Polygon'],
      default: 'Point'
    },
    coordinates: mongoose.Schema.Types.Mixed,
    radius: Number, // km
    state: String,
    district: String,
    city: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  issuedBy: String,
  department: String,
  linkedDisaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disaster',
    default: null
  },
  translations: {
    hi: { title: String, message: String },
    mr: { title: String, message: String }
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

alertSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
