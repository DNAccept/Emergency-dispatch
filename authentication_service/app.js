require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Authentication Service API',
      version: '1.0.0',
      description: 'API for Managing User Identity and Access Control'
    },
    servers: [
      { url: process.env.APP_URL || `http://localhost:${process.env.PORT || 4001}` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Serve Swagger specification for other services/hub to consume
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Host Unified Swagger Hub
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { url: '/api-docs/swagger.json', name: 'Identity & Auth Service' },
      { 
        url: process.env.INCIDENT_SERVICE_URL ? `${process.env.INCIDENT_SERVICE_URL}/api-docs/swagger.json` : 'http://localhost:4002/api-docs/swagger.json', 
        name: 'Emergency Incident Service' 
      },
      { 
        url: process.env.DISPATCH_SERVICE_URL ? `${process.env.DISPATCH_SERVICE_URL}/api-docs/swagger.json` : 'http://localhost:4003/api-docs/swagger.json', 
        name: 'Dispatch & Tracking Service' 
      },
      { 
        url: process.env.ANALYTICS_SERVICE_URL ? `${process.env.ANALYTICS_SERVICE_URL}/api-docs/swagger.json` : 'http://localhost:4004/api-docs/swagger.json', 
        name: 'Analytics & Monitoring Service' 
      }
    ]
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, swaggerUiOptions));

// Initialize Database automatically
initDB();

// Redirect root to API Docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'authentication_service' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
