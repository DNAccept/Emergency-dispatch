const express = require('express');
const router = express.Router();
const { registerVehicle, updateLocationAndStatus, getAvailableVehicles, getVehicleStatus, dispatchVehicle, getAllVehicles, deleteVehicle } = require('../controllers/vehicleController');

router.post('/register', registerVehicle);
router.post('/:id/location', updateLocationAndStatus);
router.patch('/:id/status', updateLocationAndStatus);
router.post('/:id/dispatch', dispatchVehicle);
router.get('/available', getAvailableVehicles);
router.get('/:id', getVehicleStatus);
router.get('/', getAllVehicles);
router.delete('/:id', deleteVehicle);

module.exports = router;
