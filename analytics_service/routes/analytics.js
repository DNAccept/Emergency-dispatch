const express = require('express');
const router = express.Router();
const { getResponseTimes, getIncidentsByRegion, getResourceUtilization } = require('../controllers/analyticsController');
const { getHospitals, updateHospitalCapacity } = require('../controllers/hospitalController');
const { getStations, updateStation, getPersonnel, addPersonnel, removePersonnel, updatePersonnel } = require('../controllers/resourceController');

/**
 * @swagger
 * /analytics/response-times:
 *   get:
 *     summary: Get average response times
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Response time stats }
 */
router.get('/response-times', getResponseTimes);

/**
 * @swagger
 * /analytics/incidents-by-region:
 *   get:
 *     summary: Get incident distribution by region
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Incident density data }
 */
router.get('/incidents-by-region', getIncidentsByRegion);

/**
 * @swagger
 * /analytics/resource-utilization:
 *   get:
 *     summary: Get resource usage statistics
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Resource deployment frequency }
 */
router.get('/resource-utilization', getResourceUtilization);

/**
 * @swagger
 * /analytics/hospitals:
 *   get:
 *     summary: Get hospital status and capacity
 *     tags: [Resources]
 *     responses:
 *       200: { description: Hospital list }
 */
router.get('/hospitals', getHospitals);

/**
 * @swagger
 * /analytics/hospitals/update:
 *   post:
 *     summary: Update hospital bed/ambulance capacity
 *     tags: [Resources]
 *     responses:
 *       200: { description: Capacity updated }
 */
router.post('/hospitals/update', updateHospitalCapacity);

// Resource Management
/**
 * @swagger
 * /analytics/stations:
 *   get:
 *     summary: Get all stations (Police/Fire)
 *     tags: [Resources]
 *     responses:
 *       200: { description: Station list }
 */
router.get('/stations', getStations);

/**
 * @swagger
 * /analytics/stations/update:
 *   post:
 *     summary: Update station readiness or capacity
 *     tags: [Resources]
 *     responses:
 *       200: { description: Station updated }
 */
router.post('/stations/update', updateStation);

/**
 * @swagger
 * /analytics/personnel:
 *   get:
 *     summary: Get list of all personnel
 *     tags: [Resources]
 *     responses:
 *       200: { description: Personnel list }
 */
router.get('/personnel', getPersonnel);

/**
 * @swagger
 * /analytics/personnel/register:
 *   post:
 *     summary: Register new medical/police/fire personnel
 *     tags: [Resources]
 *     responses:
 *       201: { description: Personnel registered }
 */
router.post('/personnel/register', addPersonnel);

/**
 * @swagger
 * /analytics/personnel/{id}:
 *   delete:
 *     summary: Remove personnel record
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Personnel deleted }
 */
router.delete('/personnel/:id', removePersonnel);

/**
 * @swagger
 * /analytics/personnel/{id}:
 *   put:
 *     summary: Update personnel record
 *     tags: [Resources]
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
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *     responses:
 *       200: { description: Personnel updated }
 */
router.put('/personnel/:id', updatePersonnel);

module.exports = router;
