require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/analytics_db')
  .then(() => console.log('MongoDB connected for Analytics Service'))
  .catch(err => console.error(err));

// Connect RabbitMQ Consumer
connectRabbitMQ();

app.use('/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'analytics_service' });
});

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
