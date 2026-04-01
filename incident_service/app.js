require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const incidentRoutes = require('./routes/incidents');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database automatically
initDB();

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Incident Service API',
      version: '1.0.0',
      description: 'API for Managing Emergency Incidents and Responder Matching'
    },
    servers: [
      { url: process.env.APP_URL || `http://localhost:${process.env.PORT || 4002}` }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Redirect root to API Docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.use('/incidents', incidentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'incident_service' });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Incident Service running on port ${PORT}`);
});
