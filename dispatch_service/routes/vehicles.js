const express = require('express');
const router = express.Router();
const { registerVehicle, updateLocationAndStatus, getAvailableVehicles, getVehicleStatus, dispatchVehicle, getAllVehicles, deleteVehicle } = require('../controllers/vehicleController');

/**
 * @swagger
 * /vehicles/register:
 *   post:
 *     summary: Register a new vehicle unit
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_type, unit_name, current_lat, current_long]
 *             properties:
 *               service_type: { type: string, enum: [Police, Medical, Fire] }
 *               unit_name: { type: string }
 *               current_lat: { type: number }
 *               current_long: { type: number }
 *               is_available: { type: boolean, default: true }
 *     responses:
 *       201: { description: Vehicle registered successfully }
 */
router.post('/register', registerVehicle);
router.post('/:id/location', updateLocationAndStatus);
router.patch('/:id/status', updateLocationAndStatus);
router.post('/:id/dispatch', dispatchVehicle);

/**
 * @swagger
 * /vehicles/available:
 *   get:
 *     summary: Get all available response units
 *     tags: [Vehicles]
 *     responses:
 *       200: { description: List of available vehicles }
 */
router.get('/available', getAvailableVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get specific vehicle details
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vehicle information }
 */
router.get('/:id', getVehicleStatus);
router.get('/', getAllVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Remove a vehicle from the fleet
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vehicle deleted }
 */
router.delete('/:id', deleteVehicle);

module.exports = router;
