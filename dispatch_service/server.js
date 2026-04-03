require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require('./rabbitmq');
const vehicleRoutes = require('./routes/vehicles');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dispatch Service API',
      version: '1.0.0',
      description: 'API for Managing Vehicle Fleet and Real-time Tracking'
    },
    servers: [
      { url: process.env.APP_URL || `http://localhost:${process.env.PORT || 4003}` }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connect DB - Backgrounded
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dispatch_db')
  .then(() => console.log('MongoDB connected for Dispatch Service'))
  .catch(err => console.error('MongoDB Connection Error:', err.message));

// Connect RabbitMQ - Backgrounded
connectRabbitMQ();

app.get('/', (req, res) => res.redirect('/api-docs'));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'dispatch-service' }));
app.use('/vehicles', vehicleRoutes);

const axios = require('axios');
const Vehicle = require('./models/Vehicle');
const { publishEvent } = require('./rabbitmq');

// ---------------------------------------------------------------------------
// OSRM road-routing helper — returns [lat, lng] point array or fallback line
// ---------------------------------------------------------------------------
async function getOSRMRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'TacticalDispatchSystem/1.0' }
    });
    if (res.data.routes && res.data.routes[0]) {
      // GeoJSON coords are [lng, lat] — flip to [lat, lng]
      return res.data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
    }
  } catch (e) {
    console.warn(`[OSRM] Routing failed (${e.message}), using interpolated fallback.`);
  }
  // Straight-line fallback: 20 interpolated points
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const f = i / 20;
    pts.push([fromLat + (toLat - fromLat) * f, fromLng + (toLng - fromLng) * f]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Find the nearest hospital location using Hospital vehicles' base coordinates
// as a proxy for their home hospital's position.
// Returns { lat, long } or null if no Hospital vehicles are registered.
// ---------------------------------------------------------------------------
async function findNearestHospitalCoords(fromLat, fromLng) {
  const hospitalVehicles = await Vehicle.find({ service_type: 'Hospital', base_lat: { $ne: null }, base_long: { $ne: null } });
  if (hospitalVehicles.length === 0) return null;

  let nearest = null;
  let minDist = Infinity;

  for (const v of hospitalVehicles) {
    const dLat = v.base_lat - fromLat;
    const dLng = v.base_long - fromLng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDist) { minDist = dist; nearest = { lat: v.base_lat, long: v.base_long }; }
  }
  return nearest;
}

// ---------------------------------------------------------------------------
// Checks if a vehicle is already based AT a hospital
// (i.e., its base coords are within ~0.01° of a known hospital base)
// ---------------------------------------------------------------------------
async function isBasedAtHospital(v) {
  if (v.service_type !== 'Hospital') return false;
  if (v.base_lat == null || v.base_long == null) return false;

  const hospitalVehicles = await Vehicle.find({
    service_type: 'Hospital',
    vehicle_id: { $ne: v.vehicle_id },
    base_lat: { $ne: null },
    base_long: { $ne: null }
  });

  // Vehicle is "at a hospital base" if its own base is very close to another hospital vehicle's base
  // OR simply if it is a Hospital vehicle — all Hospital vehicles ARE stationed at hospitals.
  // In this system every Hospital-type vehicle is registered at a hospital,
  // so they all qualify for the hospital drop-off loop.
  // Return false here so ALL ambulances do the hospital drop (correct behaviour).
  return false;
}

// ---------------------------------------------------------------------------
// Main simulation loop — runs every 3 seconds
// ---------------------------------------------------------------------------
setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  try {

    // === 1. MOVE vehicles that are actively travelling ===
    const movingVehicles = await Vehicle.find({
      status: { $in: ['DISPATCHED', 'HOSPITAL_DROP', 'RETURNING'] },
      target_route: { $exists: true, $not: { $size: 0 } }
    });

    for (const v of movingVehicles) {
      if (!v.target_route || v.target_route.length === 0) continue;

      // Speed: consume more points when route is long (simulates reasonable travel time)
      let skip = 1;
      if (v.target_route.length > 100) skip = 5;
      else if (v.target_route.length > 30) skip = 2;

      let nextPoint;
      for (let i = 0; i < skip; i++) {
        if (v.target_route.length > 0) nextPoint = v.target_route.shift();
      }
      v.current_lat  = nextPoint[0];
      v.current_long = nextPoint[1];

      // --- Arrival check ---
      if (v.target_route.length === 0) {
        v.target_lat = null;
        v.target_long = null;

        if (v.status === 'DISPATCHED') {
          // Arrived at incident scene
          v.status = 'ON_SCENE';
          v.wait_ticks = 5; // ~15 seconds on scene
          console.log(`[Sim] ${v.unit_name} arrived ON_SCENE`);

        } else if (v.status === 'HOSPITAL_DROP') {
          // Arrived at hospital — brief patient handoff wait, then return to base
          v.status = 'ON_SCENE'; // Reuse ON_SCENE state for the handoff wait
          v.wait_ticks = 2;      // ~6 seconds for handoff (shorter than incident wait)
          v.hospital_drop_lat  = null; // Clear the drop-off target
          v.hospital_drop_long = null;
          console.log(`[Sim] ${v.unit_name} arrived at HOSPITAL for patient drop-off`);

        } else if (v.status === 'RETURNING') {
          // Arrived back at base
          v.status = 'READY';
          console.log(`[Sim] ${v.unit_name} returned to base — READY`);
        }

        publishEvent('dispatch.status.changed', {
          event: 'dispatch.status.changed',
          vehicle_id: v.vehicle_id,
          new_status: v.status,
          timestamp: new Date().toISOString()
        });
      }

      v.markModified('target_route');
      await v.save();
    }

    // === 2. HANDLE vehicles waiting ON_SCENE ===
    const waitingVehicles = await Vehicle.find({ status: 'ON_SCENE' });

    for (const v of waitingVehicles) {
      if (v.wait_ticks > 0) {
        v.wait_ticks -= 1;
        await v.save();
        continue;
      }

      // Wait finished — decide next destination
      const needsHospitalDrop =
        v.service_type === 'Hospital' &&
        v.hospital_drop_lat == null; // null means we haven't done the drop yet

      if (needsHospitalDrop) {
        // === AMBULANCE PATH: go to nearest hospital first ===
        const hospital = await findNearestHospitalCoords(v.current_lat, v.current_long);

        if (hospital) {
          console.log(`[Sim] ${v.unit_name} heading to nearest hospital for patient drop-off`);
          const route = await getOSRMRoute(v.current_lat, v.current_long, hospital.lat, hospital.long);
          // Store a sentinel value so we know the drop is in progress
          v.hospital_drop_lat  = hospital.lat;
          v.hospital_drop_long = hospital.long;
          v.target_lat   = hospital.lat;
          v.target_long  = hospital.long;
          v.target_route = route;
          v.status = 'HOSPITAL_DROP';
          v.markModified('target_route');
          await v.save();
          publishEvent('dispatch.status.changed', {
            event: 'dispatch.status.changed',
            vehicle_id: v.vehicle_id,
            new_status: 'HOSPITAL_DROP',
            timestamp: new Date().toISOString()
          });
          continue;
        }
        // If no hospital found, fall through to normal return
      }

      // === STANDARD PATH: return to base station ===
      if (v.base_lat != null && v.base_long != null) {
        console.log(`[Sim] ${v.unit_name} returning to base station`);
        const route = await getOSRMRoute(v.current_lat, v.current_long, v.base_lat, v.base_long);
        v.target_lat   = v.base_lat;
        v.target_long  = v.base_long;
        v.target_route = route;
        v.hospital_drop_lat  = null; // Clear any leftover drop target
        v.hospital_drop_long = null;
        v.status = 'RETURNING';
        v.markModified('target_route');
        await v.save();
        publishEvent('dispatch.status.changed', {
          event: 'dispatch.status.changed',
          vehicle_id: v.vehicle_id,
          new_status: 'RETURNING',
          timestamp: new Date().toISOString()
        });
      } else {
        // No base coords — just reset immediately
        v.status = 'READY';
        v.hospital_drop_lat  = null;
        v.hospital_drop_long = null;
        await v.save();
      }
    }

  } catch (err) {
    console.error('[Sim] Loop error:', err.message);
  }
}, 3000);

const PORT = process.env.PORT || 4003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dispatch Service (v1.3.0) active on port ${PORT}`);
});

