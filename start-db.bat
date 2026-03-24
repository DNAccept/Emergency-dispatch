@echo off
echo Starting databases and RabbitMQ in the background...
docker-compose up -d postgres-auth postgres-incident mongo-dispatch mongo-analytics rabbitmq
echo Done! You can now use npm start in your service folders.
