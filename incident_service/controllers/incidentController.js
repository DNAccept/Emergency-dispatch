const { pool } = require('../db');
const axios = require('axios');

// Haversine formula to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

exports.createIncident = async (req, res) => {
  try {
    const { type, latitude, longitude } = req.body;
    
    // 1. Insert incident as OPEN
    const newIncident = await pool.query(
      'INSERT INTO incidents (type, latitude, longitude, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, latitude, longitude, 'OPEN']
    );
    const incident = newIncident.rows[0];

    // 2. Fetch available vehicles from Dispatch Service
    let assigned_unit_id = null;
    let closestDistance = Infinity;
    let closestVehicle = null;

    try {
      const dispatchUrl = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3003';
      const response = await axios.get(`${dispatchUrl}/vehicles/available`);
      const availableVehicles = response.data;

      // Filter vehicles based on type matches
      const typeMap = { 'Fire': 'Fire', 'Medical': 'Hospital', 'Crime': 'Police' };
      const idealServiceType = typeMap[type];

      const appropriateVehicles = availableVehicles.filter(v => 
        !idealServiceType || v.service_type === idealServiceType
      );

      // Find nearest
      appropriateVehicles.forEach(vehicle => {
        const dist = getDistanceFromLatLonInKm(latitude, longitude, vehicle.current_lat, vehicle.current_long);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestVehicle = vehicle;
        }
      });

      if (closestVehicle) {
        assigned_unit_id = closestVehicle.vehicle_id;
        // Update incident to DISPATCHED
        await pool.query('UPDATE incidents SET status = $1, assigned_unit_id = $2 WHERE incident_id = $3', ['DISPATCHED', assigned_unit_id, incident.incident_id]);
        incident.status = 'DISPATCHED';
        incident.assigned_unit_id = assigned_unit_id;
        
        // Notify dispatch service that the vehicle is no longer available if needed.
        // Or wait for the event queue to handle it.
      }
    } catch (err) {
      console.error('Error fetching available vehicles or dispatching:', err.message);
      // Incident remains OPEN, no unit assigned yet
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOpenIncidents = async (req, res) => {
  try {
    const incidents = await pool.query("SELECT * FROM incidents WHERE status = 'OPEN'");
    res.json(incidents.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await pool.query('SELECT * FROM incidents WHERE incident_id = $1', [id]);
    if (incident.rows.length === 0) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updated = await pool.query(
      'UPDATE incidents SET status = $1 WHERE incident_id = $2 RETURNING *',
      [status, id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ message: 'Incident not found' });
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
