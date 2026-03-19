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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
