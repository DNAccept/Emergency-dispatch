const Vehicle = require('../models/Vehicle');
const { publishEvent } = require('../rabbitmq');
const axios = require('axios');

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

exports.dispatchVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { target_lat, target_long } = req.body;
    const vehicle = await Vehicle.findOne({ vehicle_id: id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Fetch road route from OSRM (lng,lat order)
    let routePoints = [];
    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${vehicle.current_long},${vehicle.current_lat};${target_long},${target_lat}?overview=full&geometries=geojson`;
      const osrmRes = await axios.get(osrmUrl);
      if (osrmRes.data.routes && osrmRes.data.routes[0]) {
        // GeoJSON coordinates are [lng, lat]
        routePoints = osrmRes.data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
      }
    } catch (osrmErr) {
      console.error('OSRM Routing failed, falling back to straight line:', osrmErr.message);
      routePoints = [[vehicle.current_lat, vehicle.current_long], [target_lat, target_long]];
    }

    vehicle.target_lat = target_lat;
    vehicle.target_long = target_long;
    vehicle.target_route = routePoints;
    vehicle.is_available = false;
    vehicle.status = 'DISPATCHED';

    await vehicle.save();
    
    publishEvent('dispatch.status.changed', {
      event: 'dispatch.status.changed',
      vehicle_id: id,
      new_status: 'DISPATCHED',
      target: { lat: target_lat, lng: target_long },
      route: routePoints,
      timestamp: new Date().toISOString()
    });

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
