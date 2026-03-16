require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Disaster = require('./models/Disaster');
const Resource = require('./models/Resource');
const Alert = require('./models/Alert');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await User.deleteMany({});
  await Disaster.deleteMany({ source: { $in: ['admin'] } });
  await Resource.deleteMany({});
  await Alert.deleteMany({});

  // ─── Create Admin User ───────────────────────────────────────────────────
  const admin = await User.create({
    name: 'UDMS Admin',
    mobile: '9999999999',
    email: 'admin@udms.in',
    password: 'Admin@1234',
    role: 'admin',
    isVerified: true,
    language: 'en'
  });
  console.log('✅ Admin created: mobile=9999999999 password=Admin@1234');

  // ─── Create Test User ────────────────────────────────────────────────────
  await User.create({
    name: 'Rahul Sharma',
    mobile: '9876543210',
    email: 'rahul@test.com',
    password: 'User@1234',
    role: 'user',
    isVerified: true,
    language: 'hi',
    location: {
      type: 'Point',
      coordinates: [78.4867, 17.3850],
      city: 'Hyderabad',
      state: 'Telangana'
    },
    emergencyContacts: [
      { name: 'Priya Sharma', mobile: '9876543211', relation: 'Wife' }
    ]
  });
  console.log('✅ Test user created: mobile=9876543210 password=User@1234');

  // ─── Create Sample Disasters ─────────────────────────────────────────────
  const disasters = await Disaster.insertMany([
    {
      title: 'Earthquake Near Nashik',
      type: 'earthquake',
      severity: 'high',
      status: 'active',
      description: 'A 5.2 magnitude earthquake struck 30km northeast of Nashik city.',
      location: {
        type: 'Point',
        coordinates: [73.8567, 20.1209],
        city: 'Nashik',
        state: 'Maharashtra',
        district: 'Nashik'
      },
      magnitude: 5.2,
      depth: 10,
      affectedPeople: 15000,
      source: 'admin',
      isVerified: true,
      reportedBy: admin._id,
      verifiedBy: admin._id,
      casualties: { deaths: 2, injured: 45, missing: 3 }
    },
    {
      title: 'Severe Flooding in Kolhapur',
      type: 'flood',
      severity: 'critical',
      status: 'active',
      description: 'Heavy monsoon rainfall has caused severe flooding across multiple districts of Kolhapur.',
      location: {
        type: 'Point',
        coordinates: [74.2433, 16.7050],
        city: 'Kolhapur',
        state: 'Maharashtra',
        district: 'Kolhapur'
      },
      affectedPeople: 85000,
      source: 'admin',
      isVerified: true,
      reportedBy: admin._id,
      verifiedBy: admin._id,
      casualties: { deaths: 8, injured: 120, missing: 25 }
    },
    {
      title: 'Cyclone Alert - Odisha Coast',
      type: 'cyclone',
      severity: 'critical',
      status: 'monitoring',
      description: 'Cyclone "Biparjoy" is expected to make landfall near Puri with wind speeds of 180 kmph.',
      location: {
        type: 'Point',
        coordinates: [85.8245, 19.8135],
        city: 'Puri',
        state: 'Odisha'
      },
      affectedPeople: 200000,
      source: 'admin',
      isVerified: true,
      reportedBy: admin._id
    },
    {
      title: 'Wildfire in Uttarakhand Forests',
      type: 'wildfire',
      severity: 'high',
      status: 'active',
      description: 'Forest fires have been reported across 3 districts of Uttarakhand.',
      location: {
        type: 'Point',
        coordinates: [79.0193, 30.0668],
        city: 'Dehradun',
        state: 'Uttarakhand'
      },
      affectedPeople: 5000,
      source: 'admin',
      isVerified: true,
      reportedBy: admin._id
    }
  ]);
  console.log(`✅ ${disasters.length} sample disasters created`);

  // ─── Create Sample Resources ─────────────────────────────────────────────
  await Resource.insertMany([
    {
      name: 'Nanded District Hospital',
      type: 'hospital',
      location: {
        type: 'Point',
        coordinates: [77.3210, 19.1383],
        address: 'Nanded District Hospital, Station Road',
        city: 'Nanded',
        state: 'Maharashtra',
        district: 'Nanded',
        pincode: '431601'
      },
      contact: { phone: '02462-222222', email: 'hospital@nanded.gov.in' },
      capacity: { total: 500, available: 120 },
      services: ['Emergency', 'ICU', 'Surgery', 'Burns', 'Trauma'],
      operatingHours: { is24x7: true },
      isActive: true,
      isVerified: true,
      addedBy: admin._id
    },
    {
      name: 'Government Relief Camp - Kolhapur',
      type: 'relief_camp',
      location: {
        type: 'Point',
        coordinates: [74.2100, 16.6950],
        address: 'Shivaji Stadium, Kolhapur',
        city: 'Kolhapur',
        state: 'Maharashtra'
      },
      contact: { phone: '0231-2650000' },
      capacity: { total: 2000, available: 800 },
      services: ['Food', 'Shelter', 'Medical Aid', 'Clothing'],
      operatingHours: { is24x7: true },
      isActive: true,
      isVerified: true,
      linkedDisaster: disasters[1]._id,
      addedBy: admin._id
    },
    {
      name: 'NDRF Rescue Center - Nashik',
      type: 'shelter',
      location: {
        type: 'Point',
        coordinates: [73.7898, 20.0059],
        address: 'NDRF Camp, Nashik',
        city: 'Nashik',
        state: 'Maharashtra'
      },
      contact: { phone: '0253-2575000' },
      capacity: { total: 500, available: 250 },
      services: ['Search & Rescue', 'First Aid', 'Evacuation'],
      operatingHours: { is24x7: true },
      isActive: true,
      isVerified: true,
      addedBy: admin._id
    },
    {
      name: 'Community Food Center - Nanded',
      type: 'food_center',
      location: {
        type: 'Point',
        coordinates: [77.3050, 19.1500],
        address: 'Gurudwara Chowk, Nanded',
        city: 'Nanded',
        state: 'Maharashtra'
      },
      contact: { phone: '9876500001' },
      services: ['Free Meals', 'Dry Rations', 'Water'],
      operatingHours: { is24x7: false, open: '07:00', close: '21:00' },
      isActive: true,
      addedBy: admin._id
    }
  ]);
  console.log('✅ Sample resources created');

  // ─── Create Sample Alerts ────────────────────────────────────────────────
  await Alert.insertMany([
    {
      title: '🔴 RED ALERT: Flood Warning - Kolhapur',
      message: 'Heavy rainfall forecast for next 48 hours. All residents near Panchganga river must evacuate immediately.',
      type: 'evacuation',
      severity: 'critical',
      targetArea: { state: 'Maharashtra', district: 'Kolhapur', city: 'Kolhapur' },
      issuedBy: 'Maharashtra Disaster Management Authority',
      department: 'MDMA',
      linkedDisaster: disasters[1]._id,
      isActive: true,
      createdBy: admin._id,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    },
    {
      title: '⚠️ CYCLONE ALERT: Odisha Coast',
      message: 'Cyclone approaching. Evacuate coastal areas within 5km of shore. Seek shelter immediately.',
      type: 'warning',
      severity: 'critical',
      targetArea: { state: 'Odisha' },
      issuedBy: 'India Meteorological Department',
      department: 'IMD',
      isActive: true,
      createdBy: admin._id
    }
  ]);
  console.log('✅ Sample alerts created');

  console.log('\n🎉 Database seeding complete!');
  console.log('─────────────────────────────────────');
  console.log('Admin Login: mobile=9999999999, password=Admin@1234');
  console.log('User Login:  mobile=9876543210, password=User@1234');
  console.log('─────────────────────────────────────');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
