const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  total_beds: { type: Number, default: 200 },
  occupied_beds: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
