const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  service_type: { type: String, required: true, enum: ['Police', 'Fire', 'Hospital'] },
  beds: { type: Number, default: 0 },
  total_beds: { type: Number, default: 0 },
  ambulances: { type: Number, default: 0 },
  fire_trucks: { type: Number, default: 0 },
  readiness_level: { type: String, default: 'High' },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Station', stationSchema);
