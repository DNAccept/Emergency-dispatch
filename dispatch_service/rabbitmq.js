const amqp = require('amqplib');

let channel = null;

const connectRabbitMQ = async (retryCount = 5) => {
  const amqpServer = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';
  try {
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertExchange('emergency_events', 'topic', { durable: true });
    console.log('Connected to RabbitMQ in Dispatch Service');
  } catch (err) {
    console.error(`RabbitMQ connection error (Attempt ${6 - retryCount}):`, err.message);
    if (retryCount > 0) {
      console.log('Retrying RabbitMQ connection in 5 seconds...');
      setTimeout(() => connectRabbitMQ(retryCount - 1), 5000);
    }
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
