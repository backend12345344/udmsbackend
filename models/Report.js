const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  disasterType: {
    type: String,
    required: true,
    enum: [
      'earthquake', 'flood', 'cyclone', 'wildfire', 'landslide',
      'tsunami', 'drought', 'heatwave', 'storm', 'other'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
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
    state: String
  },
  images: [String],
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'moderate'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'converted'],
    default: 'pending'
  },
  adminNote: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  convertedToDisaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disaster',
    default: null
  }
}, {
  timestamps: true
});

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
