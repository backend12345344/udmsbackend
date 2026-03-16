const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    type: String,
    enum: [
      'first_aid', 'search_rescue', 'medical', 'driving', 'swimming',
      'communication', 'cooking', 'teaching', 'construction', 'other'
    ]
  }],
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  assignedDisaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disaster',
    default: null
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  idProof: String,
  experience: String,
  totalMissions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

volunteerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Volunteer', volunteerSchema);
