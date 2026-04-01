require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const vehicleRoutes = require('./routes/vehicles');
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
      title: 'Dispatch Service API',
      version: '1.0.0',
      description: 'API for Managing Vehicle Fleet and Real-time Tracking'
    },
    servers: [
      { url: process.env.APP_URL || `http://localhost:${process.env.PORT || 4003}` }
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

// Connect DB - Backgrounded
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dispatch_db')
  .then(() => console.log('MongoDB connected for Dispatch Service'))
  .catch(err => console.error('MongoDB Connection Error:', err.message));

// Connect RabbitMQ - Backgrounded
connectRabbitMQ();

app.get('/', (req, res) => res.redirect('/api-docs'));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'dispatch-service' }));
app.use('/vehicles', vehicleRoutes);

// --- Real-time Movement Simulation Loop ---
const Vehicle = require('./models/Vehicle');
setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const activeVehicles = await Vehicle.find({ target_route: { $exists: true, $not: { $size: 0 } } });
    for (const v of activeVehicles) {
      if (v.target_route && v.target_route.length > 0) {
        const nextPoint = v.target_route.shift();
        v.current_lat = nextPoint[0];
        v.current_long = nextPoint[1];
        if (v.target_route.length === 0) {
          v.target_lat = null; v.target_long = null; v.status = 'ON_SCENE';
        }
        v.markModified('target_route');
        await v.save();
      }
    }
  } catch (err) { console.error('Simulation loop error:', err.message); }
}, 3000);

const PORT = process.env.PORT || 4003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dispatch Service (v1.2.6) active on port ${PORT}`);
});
