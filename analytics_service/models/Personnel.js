const mongoose = require('mongoose');

const personnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, default: 'Available' },
  service_type: { type: String, required: true, enum: ['Police', 'Fire', 'Hospital'] },
  station_name: { type: String, required: true },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Personnel', personnelSchema);
