const express = require('express');
const router = express.Router();
const { createIncident, getOpenIncidents, getIncident, updateIncidentStatus, deleteIncident } = require('../controllers/incidentController');

router.post('/', createIncident);
router.get('/open', getOpenIncidents);
router.get('/:id', getIncident);
router.put('/:id/status', updateIncidentStatus);
router.delete('/:id', deleteIncident);

module.exports = router;
