const express = require('express');
const router = express.Router();
const { register, login, refreshToken, profile, getUsers } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new system user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [SYSTEM_ADMIN, HOSPITAL_ADMIN, POLICE_ADMIN, FIRE_ADMIN, RESPONDER] }
 *     responses:
 *       201: { description: User created }
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh an expired access token
 *     tags: [Authentication]
 *     responses:
 *       200: { description: Token refreshed }
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Profile details }
 */
router.get('/profile', authenticate, profile);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all system users
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of users }
 */
router.get('/users', authenticate, getUsers);

module.exports = router;
