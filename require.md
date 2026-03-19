Process Independence: Each of the 4 microservices must run as its own independent process.

Database Isolation: Every service must have its own dedicated database instance. Sharing a database between services is strictly prohibited.


Communication: Inter-service communication must occur via REST APIs or the defined Message Queue topics.


Authentication: Implement JWT-based security for all non-public endpoints.

2. Microservice 1: Identity & Authentication Service

Purpose: Manage user lifecycle and system access for all administrators (System, Hospital, Police, Fire).

Data Structure (Database Schema)

Users Table: user_id (PK), name, email (Unique), password_hash, role (Enum: SYSTEM_ADMIN, HOSPITAL_ADMIN, etc.), created_at.

Required API Endpoints
POST /auth/register: Create a new administrative user.

POST /auth/login: Authenticate user and return a JWT.

POST /auth/refresh-token: Issue a new JWT using a valid refresh token.

GET /auth/profile: Return details of the currently logged-in user.

3. Microservice 2: Emergency Incident Service

Purpose: The core logic engine for recording incidents and matching them to the nearest responders.

Data Structure (Database Schema)

Incidents Table: incident_id (PK), type (Fire, Medical, Crime), latitude, longitude, status (OPEN, DISPATCHED, RESOLVED), reported_at, assigned_unit_id.

Required API Endpoints
POST /incidents: Record a new emergency with GPS coordinates.

GET /incidents/open: List all currently active (unresolved) incidents.

GET /incidents/:id: Retrieve full details and status of a specific incident.

PUT /incidents/:id/status: Update incident status (e.g., to "Resolved").

Implementation Logic

Nearest Responder Matching: Implement the logic to calculate the distance between incident coordinates and available vehicle locations (fetched from the Dispatch Service) to find the "nearest appropriate" responder.
4. Microservice 3: Dispatch & Tracking Service

Purpose: Manage the real-time location and availability of responders (Ambulances, Police cars, Fire trucks).

Data Structure (Database Schema)

Vehicles Table: vehicle_id (PK), service_type (Police, Fire, Hospital), unit_name, current_lat, current_long, is_available (Boolean).

Required API Endpoints
POST /vehicles/register: Add a new response unit to the fleet.


POST /vehicles/:id/location: Update the current GPS coordinates of a vehicle (simulate with driver's phone location).

GET /vehicles/available: Return a list of all vehicles currently marked as available for dispatch.

GET /vehicles/:id: Get the live status and location of a specific unit.
5. Microservice 4: Analytics & Monitoring Service

Purpose: Aggregate data across the system to generate operational insights.

Required API Endpoints

GET /analytics/response-times: Calculate average time from report to "On Scene" status.


GET /analytics/incidents-by-region: Statistics on incident density across different areas.


GET /analytics/resource-utilization: Stats on hospital bed usage and vehicle deployment frequency.

6. Message Queue & Events
To ensure loose coupling, implement the following event structures for your Message Broker (RabbitMQ/Redis) as defined in Phase 1:

Topic: dispatch.status.changed

Payload Example:

JSON
{
  "event": "dispatch.status.changed",
  "vehicle_id": "v001",
  "new_status": "ON SCENE",
  "timestamp": "2026-03-15T14:30:00Z"
}
7. Phase 2 Checklist for Submission
[ ] All 4 services running as separate Docker containers/processes.

[ ] 4 separate databases initialized and linked.

[ ] Inter-service API calls functioning (Incident Service calling Dispatch Service).

[ ] JWT logic protecting administrative routes.

[ ] Distance-based matching logic implemented in the Incident Service.