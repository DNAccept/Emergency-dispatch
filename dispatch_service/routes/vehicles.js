const express = require('express');
const router = express.Router();
const { registerVehicle, updateLocationAndStatus, getAvailableVehicles, getVehicleStatus } = require('../controllers/vehicleController');

router.post('/register', registerVehicle);
router.post('/:id/location', updateLocationAndStatus);
router.get('/available', getAvailableVehicles);
router.get('/:id', getVehicleStatus);

module.exports = router;
