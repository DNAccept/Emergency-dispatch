// Seed script — posts vehicles to the dispatch service using axios
// Run with: node seed-vehicles.js
const axios = require('./dispatch_service/node_modules/axios');

const BASE = 'http://localhost:3003';

const vehicles = [
  // Ambulances / Hospital
  { vehicle_id: 'AMB-001', service_type: 'Hospital', unit_name: 'Ambulance Alpha',   current_lat: 5.6037, current_long: -0.1870 },
  { vehicle_id: 'AMB-002', service_type: 'Hospital', unit_name: 'Ambulance Bravo',   current_lat: 5.5960, current_long: -0.1950 },
  { vehicle_id: 'AMB-003', service_type: 'Hospital', unit_name: 'Ambulance Charlie',  current_lat: 5.6120, current_long: -0.1780 },
  { vehicle_id: 'AMB-004', service_type: 'Hospital', unit_name: 'Ambulance Delta',   current_lat: 5.6200, current_long: -0.2050 },
  { vehicle_id: 'AMB-005', service_type: 'Hospital', unit_name: 'Ambulance Echo',    current_lat: 5.5870, current_long: -0.2100 },
  // Police
  { vehicle_id: 'POL-001', service_type: 'Police', unit_name: 'Police Unit 1',  current_lat: 5.6080, current_long: -0.1820 },
  { vehicle_id: 'POL-002', service_type: 'Police', unit_name: 'Police Unit 2',  current_lat: 5.5990, current_long: -0.2000 },
  { vehicle_id: 'POL-003', service_type: 'Police', unit_name: 'Police Unit 3',  current_lat: 5.6150, current_long: -0.1700 },
  { vehicle_id: 'POL-004', service_type: 'Police', unit_name: 'Police Unit 4',  current_lat: 5.5800, current_long: -0.1900 },
  { vehicle_id: 'POL-005', service_type: 'Police', unit_name: 'Police Unit 5',  current_lat: 5.6250, current_long: -0.1950 },
  // Fire
  { vehicle_id: 'FIRE-001', service_type: 'Fire', unit_name: 'Fire Engine 1',  current_lat: 5.6010, current_long: -0.1840 },
  { vehicle_id: 'FIRE-002', service_type: 'Fire', unit_name: 'Fire Engine 2',  current_lat: 5.6090, current_long: -0.2020 },
  { vehicle_id: 'FIRE-003', service_type: 'Fire', unit_name: 'Fire Engine 3',  current_lat: 5.6180, current_long: -0.1760 },
  { vehicle_id: 'FIRE-004', service_type: 'Fire', unit_name: 'Fire Engine 4',  current_lat: 5.5930, current_long: -0.1980 },
  { vehicle_id: 'FIRE-005', service_type: 'Fire', unit_name: 'Fire Engine 5',  current_lat: 5.5850, current_long: -0.1850 },
];

async function seed() {
  let created = 0, skipped = 0;
  for (const v of vehicles) {
    try {
      await axios.post(`${BASE}/vehicles/register`, { ...v, is_available: true, status: 'AVAILABLE' });
      console.log(`  ✓ Created: ${v.unit_name} (${v.vehicle_id})`);
      created++;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.log(`  ⚠ Skipped ${v.vehicle_id}: ${msg}`);
      skipped++;
    }
  }
  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
}

seed();
