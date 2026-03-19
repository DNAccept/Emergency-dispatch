const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS incidents (
      incident_id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      latitude DECIMAL NOT NULL,
      longitude DECIMAL NOT NULL,
      status VARCHAR(50) DEFAULT 'OPEN',
      assigned_unit_id VARCHAR(50),
      reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Incidents table initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
  }
};

module.exports = { pool, initDB };
