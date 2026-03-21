require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const incidentRoutes = require('./routes/incidents');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database automatically
initDB();

app.use('/incidents', incidentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'incident_service' });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Incident Service running on port ${PORT}`);
});
