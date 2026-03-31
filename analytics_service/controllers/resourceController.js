const Station = require('../models/Station');
const Personnel = require('../models/Personnel');

// --- Station Operations ---
exports.getStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateStation = async (req, res) => {
  try {
    const { name, service_type, beds, ambulances, fire_trucks, readiness_level } = req.body;
    let station = await Station.findOne({ name });
    
    if (!station) {
      station = new Station({ name, service_type, beds, ambulances, fire_trucks, readiness_level });
    } else {
      if (beds !== undefined) station.beds = beds;
      if (ambulances !== undefined) station.ambulances = ambulances;
      if (fire_trucks !== undefined) station.fire_trucks = fire_trucks;
      if (readiness_level !== undefined) station.readiness_level = readiness_level;
      station.last_updated = Date.now();
    }
    
    await station.save();
    res.json(station);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- Personnel Operations ---
exports.getPersonnel = async (req, res) => {
  try {
    const { station_name, service_type } = req.query;
    let filter = {};
    if (station_name) filter.station_name = station_name;
    if (service_type) filter.service_type = service_type;
    
    const staff = await Personnel.find(filter);
    res.json(staff);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addPersonnel = async (req, res) => {
  try {
    const { name, role, service_type, station_name } = req.body;
    const staff = new Personnel({ name, role, service_type, station_name });
    await staff.save();
    res.status(201).json(staff);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.removePersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    await Personnel.findByIdAndDelete(id);
    res.json({ message: 'Personnel removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
