const express = require('express');
const router = express.Router();
const {
  registerVehicle, updateLocationAndStatus, getAvailableVehicles,
  getVehicleStatus, dispatchVehicle, getAllVehicles, deleteVehicle, updateVehicleInfo
} = require('../controllers/vehicleController');
const { authenticate } = require('../middleware/authMiddleware');

// ── Internal / public endpoints ───────────────────────────────────────────────
// MUST be registered BEFORE /:id routes so Express doesn't mistake
// "available" for a vehicle ID. Called server-to-server by the incident service
// (no user JWT in those requests).
router.get('/available', getAvailableVehicles);
router.post('/:id/dispatch', dispatchVehicle);

// ── Admin-protected write operations (require user JWT) ───────────────────────
router.post('/register', authenticate, registerVehicle);
router.post('/:id/location', authenticate, updateLocationAndStatus);
router.patch('/:id/status', authenticate, updateLocationAndStatus);
router.put('/:id', authenticate, updateVehicleInfo);
router.delete('/:id', authenticate, deleteVehicle);

// ── Admin-protected read operations (frontend dashboards) ─────────────────────
router.get('/', authenticate, getAllVehicles);
router.get('/:id', authenticate, getVehicleStatus);

module.exports = router;
