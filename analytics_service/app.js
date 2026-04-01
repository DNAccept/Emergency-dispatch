require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const analyticsRoutes = require('./routes/analytics');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analytics Service API',
      version: '1.0.0',
      description: 'API for System Aggregation and Monitoring Insights'
    },
    servers: [
      { url: process.env.APP_URL || `http://localhost:${process.env.PORT || 4004}` }
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

// Connect DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/analytics_db')
  .then(() => console.log('MongoDB connected for Analytics Service'))
  .catch(err => console.error('MongoDB Connection Error:', err.message));

// Connect RabbitMQ Consumer
connectRabbitMQ();

app.get('/', (req, res) => res.redirect('/api-docs'));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'analytics_service' }));
app.use('/analytics', analyticsRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
