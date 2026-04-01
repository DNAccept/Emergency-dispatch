const express = require('express');
const router = express.Router();
const { createIncident, getOpenIncidents, getIncident, updateIncidentStatus, deleteIncident } = require('../controllers/incidentController');

/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Create a new emergency incident
 *     tags: [Incidents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, latitude, longitude]
 *             properties:
 *               type: { type: string, enum: [Fire, Medical, Crime] }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       201: { description: Incident created }
 */
router.post('/', createIncident);

/**
 * @swagger
 * /incidents/open:
 *   get:
 *     summary: Get all open incidents
 *     tags: [Incidents]
 *     responses:
 *       200: { description: List of open incidents }
 */
router.get('/open', getOpenIncidents);

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     summary: Get a specific incident by ID
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Incident details }
 */
router.get('/:id', getIncident);

/**
 * @swagger
 * /incidents/{id}/status:
 *   put:
 *     summary: Update an incident's status
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [OPEN, DISPATCHED, ON_SCENE, RESOLVED] }
 *     responses:
 *       200: { description: Status updated }
 */
router.put('/:id/status', updateIncidentStatus);

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Delete an incident record
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Incident deleted }
 */
router.delete('/:id', deleteIncident);

module.exports = router;
