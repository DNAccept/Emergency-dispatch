const express = require('express');
const router = express.Router();
const { register, login, refreshToken, profile, getUsers } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticate, profile);
router.get('/users', authenticate, getUsers);

module.exports = router;
