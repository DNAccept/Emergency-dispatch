require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const vehicleRoutes = require('./routes/vehicles');
const dispatchRoutes = require('./routes/dispatch');

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Connect DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dispatch_db')
  .then(() => console.log('MongoDB connected for Dispatch Service'))
  .catch(err => console.error('MongoDB Connection Error:', err.message));

// Connect RabbitMQ
connectRabbitMQ();

app.get('/', (req, res) => res.json({ status: 'OK', service: 'dispatch-service', version: '1.2.0' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'dispatch-service' }));
app.use('/vehicles', vehicleRoutes);
app.use('/dispatch', dispatchRoutes);

// --- Real-time Movement Simulation Loop ---
const Vehicle = require('./models/Vehicle');
setInterval(async () => {
  try {
    const activeVehicles = await Vehicle.find({ target_route: { $exists: true, $not: { $size: 0 } } });
    for (const v of activeVehicles) {
      if (v.target_route && v.target_route.length > 0) {
        // Pop current position from route (we move along waypoints)
        // Skip ahead to the next waypoint
        const nextPoint = v.target_route.shift();
        v.current_lat = nextPoint[0];
        v.current_long = nextPoint[1];

        // If route is now empty, we have arrived
        if (v.target_route.length === 0) {
          v.target_lat = null;
          v.target_long = null;
          v.status = 'ON_SCENE';
        }
        
        // Mark the field as modified so Mongoose saves the array shift
        v.markModified('target_route');
        await v.save();
      }
    }
  } catch (err) {
    console.error('Simulation loop error:', err.message);
  }
}, 3000); // Faster updates for smoother road travel

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'dispatch_service' });
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Dispatch Service running on port ${PORT}`);
});
