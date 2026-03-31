const express = require('express');
const router = express.Router();
const { registerVehicle, updateLocationAndStatus, getAvailableVehicles, getVehicleStatus, dispatchVehicle, getAllVehicles } = require('../controllers/vehicleController');

router.post('/register', registerVehicle);
router.post('/:id/location', updateLocationAndStatus);
router.post('/:id/dispatch', dispatchVehicle);
router.get('/available', getAvailableVehicles);
router.get('/:id', getVehicleStatus);
router.get('/', getAllVehicles);

module.exports = router;
