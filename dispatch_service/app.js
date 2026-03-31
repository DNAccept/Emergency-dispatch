require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const vehicleRoutes = require('./routes/vehicles');

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dispatch_db')
  .then(() => console.log('MongoDB connected for Dispatch Service'))
  .catch(err => console.error(err));

// Connect RabbitMQ
connectRabbitMQ();

app.use('/vehicles', vehicleRoutes);

// --- Real-time Movement Simulation Loop ---
const Vehicle = require('./models/Vehicle');
setInterval(async () => {
  try {
    const activeVehicles = await Vehicle.find({ target_lat: { $ne: null }, target_long: { $ne: null } });
    for (const v of activeVehicles) {
      const dLat = v.target_lat - v.current_lat;
      const dLong = v.target_long - v.current_long;
      
      // Move 10% closer each tick
      const stepLat = dLat * 0.1;
      const stepLong = dLong * 0.1;

      v.current_lat += stepLat;
      v.current_long += stepLong;

      // If very close, snap to target and clear
      if (Math.abs(dLat) < 0.0001 && Math.abs(dLong) < 0.0001) {
        v.current_lat = v.target_lat;
        v.current_long = v.target_long;
        v.target_lat = null;
        v.target_long = null;
        v.status = 'ON_SCENE';
      }
      await v.save();
    }
  } catch (err) {
    console.error('Simulation loop error:', err.message);
  }
}, 4000);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'dispatch_service' });
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Dispatch Service running on port ${PORT}`);
});
