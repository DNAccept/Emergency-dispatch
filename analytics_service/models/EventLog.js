const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  event_type:         { type: String, required: true },
  vehicle_id:         { type: String },
  unit_name:          { type: String, default: null },
  new_status:         { type: String },
  service_type:       { type: String, default: null }, // Police / Fire / Hospital
  incident_type:      { type: String, default: null }, // Medical / Fire / Crime / Traffic
  response_time_secs: { type: Number, default: null }, // null unless new_status === ON_SCENE
  timestamp:          { type: Date,   default: Date.now }
});

module.exports = mongoose.model('EventLog', eventLogSchema);

