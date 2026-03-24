# Emergency Dispatch System

This application is composed of multiple microservices:
- `authentication_service`: Handles user registration and JWT authentication.
- `incident_service`: Handles logging emergency incidents.
- `dispatch_service`: Handles tracking of available emergency vehicles.
- `analytics_service`: Provides insights and resource tracking.

## Prerequisites
- **Node.js**: Recommended v18+
- **Docker** and **Docker Compose**: Required to run the databases (Postgres, MongoDB) and message broker (RabbitMQ).

---

## Setting up your Environment

You have two primary options for running this application depending on whether you are actively developing code or just want to run the application as-is.

### Option A: Local Development Workflow (Recommended for coding)
In this workflow, you run your databases inside Docker, but you run your Node.js code natively on your machine so you can take advantage of fast reloads (`nodemon`) and IDE debugging.

**1. Start the Data Infrastructure**
Open a terminal in the root directory and run the included batch script:
```bash
# On Windows
.\start-db.bat

# Or manually:
docker-compose up -d postgres-auth postgres-incident mongo-dispatch mongo-analytics rabbitmq
```

**2. Configure Environment Variables**
For each service you want to run locally, you need a `.env` file mapped to the Docker ports locally (5432, 27017, etc). 
*Example for `authentication_service/.env`:*
```env
PORT=4001
DB_HOST=localhost
DB_PORT=5432
DB_USER=auth_user
DB_PASS=auth_password
DB_NAME=auth_db
JWT_SECRET=supersecretjwtkey
```

**3. Install Dependencies & Start Services**
In separate terminal windows for each service you are working on:
```bash
cd incident_service
npm install
npm start
```
*Note: We have mapped local local `npm start` execution to ports `4001-4004` to prevent collision with Docker!*

---

### Option B: Full-Stack Docker Deployment
You can run the entire application natively inside Docker. The API ports will be mapped from `3001` to `3004`.

```bash
# From the root directory:
docker-compose up --build
```
Once started, you can test endpoints against `http://localhost:3001` to `http://localhost:3004`.

---

## ⚠️ Common Mistakes to Avoid (Troubleshooting)

### 1. The `EADDRINUSE` Error (Port Conflicts)
**Error:** `listen EADDRINUSE: address already in use :::3002`
This happens when you try to run `npm start` on a port that is already occupied.
- **Fix:** If Docker is running the full stack (`docker-compose up`), it already binds ports 3001-3004 on your machine. Either stop the Docker services, or customize your local `.env` files to run on the `4001-4004` range instead.

### 2. The `Cannot find module 'dotenv'` Error
**Error:** Node fails to start looking for a specific package.
- **Fix:** Remember to run `npm install` inside **each** microservice directory before running `npm start` for the first time. The root directory alone does not install packages for the individual services.

### 3. Missing Output Data / DB Connection Failures
**Error:** `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`
- **Fix:** You forgot to create the `.env` file in the service directory when trying to run it directly with `npm start`! `docker-compose` injects credentials automatically, but local node execution relies entirely on local `.env` values.

### 4. `404 Cannot GET /auth/register` when testing Apis
**Fix:** You most likely pasted the `/register` or `/login` URL into your web browser. Web browsers only execute `GET` HTTP requests. You must use a tool like Postman, cURL, or the `REST Client` extension (using the `endpoints.http` file) to send a `POST` request.
