const Vehicle = require('../models/Vehicle');
const { publishEvent } = require('../rabbitmq');

exports.registerVehicle = async (req, res) => {
  try {
    const { vehicle_id, service_type, unit_name, current_lat, current_long } = req.body;
    const newVehicle = new Vehicle({ vehicle_id, service_type, unit_name, current_lat, current_long });
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLocationAndStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_lat, current_long, status, is_available } = req.body;

    const vehicle = await Vehicle.findOne({ vehicle_id: id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    let statusChanged = false;
    
    if (current_lat !== undefined) vehicle.current_lat = current_lat;
    if (current_long !== undefined) vehicle.current_long = current_long;
    
    if (status !== undefined && vehicle.status !== status) {
      vehicle.status = status;
      statusChanged = true;
    }
    
    if (is_available !== undefined) vehicle.is_available = is_available;

    await vehicle.save();

    if (statusChanged) {
      publishEvent('dispatch.status.changed', {
        event: 'dispatch.status.changed',
        vehicle_id: id,
        new_status: status,
        timestamp: new Date().toISOString()
      });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ is_available: true });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ vehicle_id: id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
