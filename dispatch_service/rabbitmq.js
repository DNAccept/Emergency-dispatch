const amqp = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertExchange('emergency_events', 'topic', { durable: true });
    console.log('Connected to RabbitMQ in Dispatch Service');
  } catch (err) {
    console.error('RabbitMQ connection error in Dispatch:', err);
  }
};

const publishEvent = (routingKey, payload) => {
  if (channel) {
    channel.publish('emergency_events', routingKey, Buffer.from(JSON.stringify(payload)));
  } else {
    console.warn('RabbitMQ channel not available to publish event');
  }
};

module.exports = { connectRabbitMQ, publishEvent };
