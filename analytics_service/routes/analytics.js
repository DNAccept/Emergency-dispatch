const express = require('express');
const router = express.Router();
const { getResponseTimes, getIncidentsByRegion, getResourceUtilization } = require('../controllers/analyticsController');
const { getHospitals, updateHospitalCapacity } = require('../controllers/hospitalController');
const { getStations, updateStation, getPersonnel, addPersonnel, removePersonnel } = require('../controllers/resourceController');

router.get('/response-times', getResponseTimes);
router.get('/incidents-by-region', getIncidentsByRegion);
router.get('/resource-utilization', getResourceUtilization);
router.get('/hospitals', getHospitals);
router.post('/hospitals/update', updateHospitalCapacity);

// Resource Management
router.get('/stations', getStations);
router.post('/stations/update', updateStation);
router.get('/personnel', getPersonnel);
router.post('/personnel/register', addPersonnel);
router.delete('/personnel/:id', removePersonnel);

module.exports = router;
