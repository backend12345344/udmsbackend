const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hospital', 'shelter', 'relief_camp', 'food_center', 'police', 'fire_station', 'ngo', 'water_point']
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
    district: String,
    pincode: String
  },
  contact: {
    phone: String,
    alternatePhone: String,
    email: String
  },
  capacity: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  services: [String],
  operatingHours: {
    is24x7: { type: Boolean, default: false },
    open: String,
    close: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  description: String,
  images: [String],
  linkedDisaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disaster',
    default: null
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

resourceSchema.index({ location: '2dsphere' });
resourceSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
