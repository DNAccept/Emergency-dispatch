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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'dispatch_service' });
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Dispatch Service running on port ${PORT}`);
});
