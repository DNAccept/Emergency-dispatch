require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Connect DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/analytics_db')
  .then(() => console.log('MongoDB connected for Analytics Service'))
  .catch(err => console.error('MongoDB Connection Error:', err.message));

// Connect RabbitMQ Consumer
connectRabbitMQ();

app.get('/', (req, res) => res.json({ status: 'OK', service: 'analytics-service', version: '1.2.0' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'analytics_service' }));
app.use('/analytics', analyticsRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
