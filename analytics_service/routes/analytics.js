const express = require('express');
const router = express.Router();
const { getResponseTimes, getIncidentsByRegion, getResourceUtilization } = require('../controllers/analyticsController');
const { getHospitals, updateHospitalCapacity } = require('../controllers/hospitalController');

router.get('/response-times', getResponseTimes);
router.get('/incidents-by-region', getIncidentsByRegion);
router.get('/resource-utilization', getResourceUtilization);
router.get('/hospitals', getHospitals);
router.post('/hospitals/update', updateHospitalCapacity);

module.exports = router;
