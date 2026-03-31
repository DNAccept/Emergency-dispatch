const express = require('express');
const router = express.Router();
const { registerVehicle, updateLocationAndStatus, getAvailableVehicles, getVehicleStatus, dispatchVehicle } = require('../controllers/vehicleController');

router.post('/register', registerVehicle);
router.post('/:id/location', updateLocationAndStatus);
router.post('/:id/dispatch', dispatchVehicle);
router.get('/available', getAvailableVehicles);
router.get('/:id', getVehicleStatus);

module.exports = router;
