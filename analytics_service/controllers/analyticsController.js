const mongoose = require('mongoose');
const axios = require('axios');
const EventLog = require('../models/EventLog');

// ── DB guard helper ───────────────────────────────────────────────────────────
function dbReady(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
    return false;
  }
  return true;
}

// ── GET /analytics/response-times ────────────────────────────────────────────
// Returns overall average + per-service-type averages from actual ON_SCENE events
exports.getResponseTimes = async (req, res) => {
  if (!dbReady(res)) return;
  try {
    // Only events that have a recorded response time (ON_SCENE arrivals)
    const docs = await EventLog.find({
      new_status: 'ON_SCENE',
      response_time_secs: { $ne: null, $gt: 0 }
    }).lean();

    if (docs.length === 0) {
      return res.json({
        average_response_time_mins: null,
        by_service_type: {},
        total_on_scene_events: 0,
        description: 'No response-time data recorded yet. Dispatch a unit to an incident to begin.'
      });
    }

    const overall = docs.reduce((s, d) => s + d.response_time_secs, 0) / docs.length;

    // Group by service_type
    const byType = {};
    docs.forEach(d => {
      const k = d.service_type || 'Unknown';
      if (!byType[k]) byType[k] = [];
      byType[k].push(d.response_time_secs);
    });
    const byTypeAvg = {};
    Object.entries(byType).forEach(([k, arr]) => {
      byTypeAvg[k] = parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1));
    });

    res.json({
      average_response_time_secs: parseFloat(overall.toFixed(1)),
      average_response_time_mins: parseFloat((overall / 60).toFixed(2)),
      by_service_type: byTypeAvg,
      total_on_scene_events: docs.length,
      description: 'Mean transit time from DISPATCHED to ON_SCENE.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /analytics/dispatch-activity ─────────────────────────────────────────
// Returns the last 30 significant dispatch events for the live activity feed
exports.getDispatchActivity = async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const events = await EventLog.find({
      new_status: { $in: ['DISPATCHED', 'ON_SCENE', 'RETURNING', 'READY', 'HOSPITAL_DROP_COMPLETE'] }
    })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /analytics/incident-type-breakdown ────────────────────────────────────
// Returns count of dispatches grouped by incident_type
exports.getIncidentTypeBreakdown = async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const pipeline = [
      { $match: { new_status: 'DISPATCHED', incident_type: { $ne: null } } },
      { $group: { _id: '$incident_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];
    const result = await EventLog.aggregate(pipeline);
    // Reshape to { Medical: 12, Fire: 5, ... }
    const breakdown = {};
    result.forEach(r => { breakdown[r._id] = r.count; });
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /analytics/incidents-by-region ───────────────────────────────────────
exports.getIncidentsByRegion = async (req, res) => {
  try {
    const incidentUrl = process.env.INCIDENT_SERVICE_URL || 'https://incident-service-9yox.onrender.com';
    const response = await axios.get(`${incidentUrl}/incidents/open`, { timeout: 8000 });
    const incidents = response.data;
    
    const regions = { NorthEast: 0, NorthWest: 0, SouthEast: 0, SouthWest: 0 };
    incidents.forEach(inc => {
      if (inc.latitude >= 0 && inc.longitude >= 0) regions.NorthEast++;
      else if (inc.latitude >= 0 && inc.longitude < 0) regions.NorthWest++;
      else if (inc.latitude < 0 && inc.longitude >= 0) regions.SouthEast++;
      else regions.SouthWest++;
    });
    res.json({ density_map: regions, total: incidents.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /analytics/resource-utilization ──────────────────────────────────────
exports.getResourceUtilization = async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const totalDispatches = await EventLog.countDocuments({ new_status: 'DISPATCHED' });
    const totalOnScene    = await EventLog.countDocuments({ new_status: 'ON_SCENE' });
    res.json({
      total_dispatches_recorded: totalDispatches,
      total_on_scene_recorded: totalOnScene,
      vehicle_deployment_frequency: totalDispatches > 10 ? 'High' : 'Normal'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
