const express = require('express');
const router = express.Router();
const { getResponseTimes, getIncidentsByRegion, getResourceUtilization } = require('../controllers/analyticsController');

router.get('/response-times', getResponseTimes);
router.get('/incidents-by-region', getIncidentsByRegion);
router.get('/resource-utilization', getResourceUtilization);

module.exports = router;
