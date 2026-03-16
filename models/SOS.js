const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    accuracy: Number
  },
  message: {
    type: String,
    default: 'EMERGENCY! I need immediate help!'
  },
  type: {
    type: String,
    enum: ['medical', 'fire', 'flood', 'earthquake', 'general', 'trapped', 'other'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'false_alarm'],
    default: 'active'
  },
  responders: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date, default: Date.now },
    message: String
  }],
  notifiedContacts: [{
    name: String,
    mobile: String,
    notifiedAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['sms', 'call', 'push'] }
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

sosSchema.index({ location: '2dsphere' });
sosSchema.index({ user: 1, status: 1 });
sosSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SOS', sosSchema);
