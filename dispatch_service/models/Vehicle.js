const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true, unique: true },
  service_type: { type: String, required: true, enum: ['Police', 'Fire', 'Hospital'] },
  unit_name: { type: String, required: true },
  current_lat: { type: Number, required: true },
  current_long: { type: Number, required: true },
  is_available: { type: Boolean, default: true },
  status: { type: String, default: 'AVAILABLE' } 
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
