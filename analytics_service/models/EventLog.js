const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  event_type: { type: String, required: true },
  vehicle_id: { type: String },
  new_status: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventLog', eventLogSchema);
