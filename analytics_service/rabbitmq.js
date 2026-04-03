const amqp = require('amqplib');
const EventLog = require('./models/EventLog');

const connectRabbitMQ = async () => {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';
    const connection = await amqp.connect(amqpServer);
    const channel = await connection.createChannel();
    
    await channel.assertExchange('emergency_events', 'topic', { durable: true });
    
    // Create a queue for analytics
    const q = await channel.assertQueue('analytics_queue', { exclusive: false });
    
    // Bind the queue to the exchange
    await channel.bindQueue(q.queue, 'emergency_events', 'dispatch.status.changed');
    
    console.log('Connected to RabbitMQ in Analytics Service. Waiting for events...');
    
    channel.consume(q.queue, async (msg) => {
      if (msg.content) {
        const payload = JSON.parse(msg.content.toString());
        console.log('Analytics Service received event:', payload.new_status, payload.vehicle_id);
        
        // Save enriched event to MongoDB for analysis
        try {
          const newEvent = new EventLog({
            event_type:         payload.event,
            vehicle_id:         payload.vehicle_id,
            unit_name:          payload.unit_name         || null,
            new_status:         payload.new_status,
            service_type:       payload.service_type      || null,
            incident_type:      payload.incident_type     || null,
            response_time_secs: payload.response_time_secs != null ? payload.response_time_secs : null,
            timestamp:          payload.timestamp ? new Date(payload.timestamp) : new Date()
          });
          await newEvent.save();
        } catch (err) {
          console.error('Error saving event log:', err);
        }
      }
      channel.ack(msg);
    }, { noAck: false });
    
  } catch (err) {
    console.error('RabbitMQ connection error in Analytics:', err);
  }
};

module.exports = { connectRabbitMQ };

