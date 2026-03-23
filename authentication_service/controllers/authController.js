const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Basic in-memory store for refresh tokens (use Redis/DB in prod)
let refreshTokens = []; 

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role, created_at',
      [name, email, password_hash, role || 'SYSTEM_ADMIN']
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: 'Invalid Email or Password' });
    const user = userResult.rows[0];

    // Validate password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ message: 'Invalid Email or Password' });

    // Generate tokens
    const accessToken = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    refreshTokens.push(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'Refresh token required' });
  if (!refreshTokens.includes(token)) return res.status(403).json({ message: 'Invalid refresh token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token expired or invalid' });
    const newAccessToken = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken: newAccessToken });
  });
};

exports.profile = async (req, res) => {
  try {
    const userResult = await pool.query('SELECT user_id, name, email, role, created_at FROM users WHERE user_id = $1', [req.user.user_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(userResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const usersResult = await pool.query('SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(usersResult.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
