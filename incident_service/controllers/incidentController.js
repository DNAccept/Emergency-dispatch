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
    // 1. types is now an array (e.g. ['Fire', 'Medical'])
    const { types, latitude, longitude } = req.body;
    const typeLabel = Array.isArray(types) ? types.join(', ') : types;
    
    // 2. Insert incident
    const newIncident = await pool.query(
      'INSERT INTO incidents (type, latitude, longitude, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [typeLabel, latitude, longitude, 'OPEN']
    );
    const incident = newIncident.rows[0];

    // 3. Fetch all available vehicles to find nearest for EACH nature
    const dispatchUrl = process.env.DISPATCH_SERVICE_URL || 'http://localhost:4003';
    const response = await axios.get(`${dispatchUrl}/vehicles/available`);
    const availableVehicles = response.data;

    const assignedUnits = [];
    const typeMap = { 'Fire': 'Fire', 'Medical': 'Hospital', 'Crime': 'Police' };
    const natures = Array.isArray(types) ? types : [types];

    for (const nature of natures) {
      const targetService = typeMap[nature];
      const candidates = availableVehicles.filter(v => v.service_type === targetService && !assignedUnits.includes(v.vehicle_id));
      
      let closest = null;
      let minDist = Infinity;

      candidates.forEach(v => {
        const d = getDistanceFromLatLonInKm(latitude, longitude, v.current_lat, v.current_long);
        if (d < minDist) {
          minDist = d;
          closest = v;
        }
      });

      if (closest) {
        assignedUnits.push(closest.vehicle_id);
        // Trigger automated dispatch in the Dispatch Service
        try {
          await axios.post(`${dispatchUrl}/vehicles/${closest.vehicle_id}/dispatch`, {
            target_lat: latitude,
            target_long: longitude
          });
        } catch (err) {
          console.error(`Failed to dispatch vehicle ${closest.vehicle_id}:`, err.message);
        }
      }
    }

    // Update incident if units were assigned
    if (assignedUnits.length > 0) {
      const unitsLabel = assignedUnits.join(', ');
      await pool.query('UPDATE incidents SET status = $1, assigned_unit_id = $2 WHERE incident_id = $3', ['DISPATCHED', unitsLabel, incident.incident_id]);
      incident.status = 'DISPATCHED';
      incident.assigned_unit_id = unitsLabel;
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

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await pool.query('DELETE FROM incidents WHERE incident_id = $1 RETURNING *', [id]);
    if (deleted.rows.length === 0) return res.status(404).json({ message: 'Incident not found' });
    res.json({ message: 'Incident deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
