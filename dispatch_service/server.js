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

const axios = require('axios');
const Vehicle = require('./models/Vehicle');
const { publishEvent } = require('./rabbitmq');
setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    // 1. Move active vehicles (DISPATCHED or RETURNING)
    const activeVehicles = await Vehicle.find({ 
      status: { $in: ['DISPATCHED', 'RETURNING'] }, 
      target_route: { $exists: true, $not: { $size: 0 } } 
    });
    for (const v of activeVehicles) {
      if (v.target_route && v.target_route.length > 0) {
        let skip = 1;
        if (v.target_route.length > 100) skip = 5;
        else if (v.target_route.length > 30) skip = 2;
        
        let nextPoint;
        for (let i = 0; i < skip; i++) {
          if (v.target_route.length > 0) nextPoint = v.target_route.shift();
        }
        
        v.current_lat = nextPoint[0]; v.current_long = nextPoint[1];

        // Arrival Check
        if (v.target_route.length === 0) {
          if (v.status === 'DISPATCHED') {
            v.status = 'ON_SCENE';
            v.wait_ticks = 5; // Stay for ~15 seconds (5 loop ticks)
            console.log(`[Simulation] ${v.unit_name} arrived ON_SCENE`);
          } else if (v.status === 'RETURNING') {
            v.status = 'READY';
            console.log(`[Simulation] ${v.unit_name} returned and is now READY`);
          }
          v.target_lat = null; v.target_long = null;
          publishEvent('dispatch.status.changed', {
            event: 'dispatch.status.changed',
            vehicle_id: v.vehicle_id,
            new_status: v.status,
            timestamp: new Date().toISOString()
          });
        }
        v.markModified('target_route');
        await v.save();
      }
    }

    // 2. Handle waiting vehicles at scene and trigger return trip
    const waitingVehicles = await Vehicle.find({ status: 'ON_SCENE' });
    for (const v of waitingVehicles) {
      if (v.wait_ticks > 0) {
        v.wait_ticks -= 1;
        await v.save();
      } else {
        // Trigger Return Trip to base_lat/base_long
        if (v.base_lat && v.base_long) {
          console.log(`[Simulation] ${v.unit_name} starting return trip to base`);
          let routePoints = [];
          try {
            const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${v.current_long},${v.current_lat};${v.base_long},${v.base_lat}?overview=full&geometries=geojson`;
            const osrmRes = await axios.get(osrmUrl, { timeout: 5000 });
            if (osrmRes.data.routes && osrmRes.data.routes[0]) {
              routePoints = osrmRes.data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
            }
          } catch (e) {
            // Simple interpolation fallback
            for (let i=0; i<=10; i++) {
              const f = i/10;
              routePoints.push([v.current_lat + (v.base_lat-v.current_lat)*f, v.current_long + (v.base_long-v.current_long)*f]);
            }
          }
          v.target_lat = v.base_lat; v.target_long = v.base_long;
          v.target_route = routePoints;
          v.status = 'RETURNING';
          await v.save();
          publishEvent('dispatch.status.changed', {
            event: 'dispatch.status.changed', vehicle_id: v.vehicle_id, new_status: 'RETURNING', timestamp: new Date().toISOString()
          });
        } else {
          // If no base, just reset to READY
          v.status = 'READY'; await v.save();
        }
      }
    }
  } catch (err) { console.error('Simulation loop error:', err.message); }
}, 3000);

const PORT = process.env.PORT || 4003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dispatch Service (v1.2.6) active on port ${PORT}`);
});
