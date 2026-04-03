const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true, unique: true },
  service_type: { type: String, required: true, enum: ['Police', 'Fire', 'Hospital'] },
  unit_name: { type: String, required: true },
  parking_station: { type: String, default: 'Main Base' },
  current_lat: { type: Number, required: true },
  current_long: { type: Number, required: true },
  base_lat: { type: Number, default: null },
  base_long: { type: Number, default: null },
  target_lat: { type: Number, default: null },
  target_long: { type: Number, default: null },
  target_route: { type: Array, default: [] },
  // Intermediate hospital drop-off point for ambulances (Hospital vehicles)
  hospital_drop_lat: { type: Number, default: null },
  hospital_drop_long: { type: Number, default: null },
  // Analytics tracking fields
  dispatched_at: { type: Date, default: null },   // stamped when DISPATCHED begins
  incident_type: { type: String, default: null },  // Medical / Fire / Crime / Traffic
  status: {
    type: String,
    enum: ['READY', 'FAULTY', 'PENDING', 'DISPATCHED', 'ON_SCENE', 'HOSPITAL_DROP', 'RETURNING'],
    default: 'READY'
  },
  wait_ticks: { type: Number, default: 0 }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

