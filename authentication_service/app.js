require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database automatically
initDB();

app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'authentication_service' });
});

app.get('/env-check', (req, res) => {
  res.json({
    DB_HOST: !!process.env.DB_HOST,
    DB_PORT: !!process.env.DB_PORT,
    DB_USER: !!process.env.DB_USER,
    DB_PASS: !!process.env.DB_PASS,
    DB_NAME: !!process.env.DB_NAME,
    JWT_SECRET: !!process.env.JWT_SECRET,
    PORT: process.env.PORT,
    DATABASE_URL: !!process.env.DATABASE_URL
  });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
