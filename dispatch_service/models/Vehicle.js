const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true, unique: true },
  service_type: { type: String, required: true, enum: ['Police', 'Fire', 'Hospital'] },
  unit_name: { type: String, required: true },
  parking_station: { type: String, default: 'Main Base' },
  current_lat: { type: Number, required: true },
  current_long: { type: Number, required: true },
  target_lat: { type: Number, default: null },
  target_long: { type: Number, default: null },
  target_route: { type: Array, default: [] },
  status: { type: String, enum: ['READY', 'FAULTY', 'PENDING', 'DISPATCHED', 'ON_SCENE'], default: 'READY' } 
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
