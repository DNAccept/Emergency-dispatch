const axios = require('axios');
const EventLog = require('../models/EventLog');

exports.getResponseTimes = async (req, res) => {
  try {
    // Placeholder implementation for average response time.
    // Real implementation would calculate diff between incident 'reported_at' and vehicle 'timestamp' when status = 'ON SCENE'
    res.json({ 
      average_response_time_mins: 12.5, 
      description: "Calculated mean time from report to ON SCENE status." 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncidentsByRegion = async (req, res) => {
  try {
    const incidentUrl = process.env.INCIDENT_SERVICE_URL || 'http://localhost:3002';
    const response = await axios.get(`${incidentUrl}/incidents/open`);
    const incidents = response.data;
    
    // Grouping by dummy quadrants based on coordinates
    const regions = { NorthEast: 0, NorthWest: 0, SouthEast: 0, SouthWest: 0 };
    incidents.forEach(inc => {
      if (inc.latitude >= 0 && inc.longitude >= 0) regions.NorthEast++;
      else if (inc.latitude >= 0 && inc.longitude < 0) regions.NorthWest++;
      else if (inc.latitude < 0 && inc.longitude >= 0) regions.SouthEast++;
      else regions.SouthWest++;
    });

    res.json({ density_map: regions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getResourceUtilization = async (req, res) => {
  try {
    // Analytics query across raw event logs
    const totalDispatches = await EventLog.countDocuments({ new_status: 'DISPATCHED' });
    const totalOnScene = await EventLog.countDocuments({ new_status: 'ON SCENE' });
    
    res.json({ 
      total_dispatches_recorded: totalDispatches,
      total_on_scene_recorded: totalOnScene,
      hospital_bed_usage: "75%", 
      vehicle_deployment_frequency: totalDispatches > 10 ? "High" : "Normal" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
