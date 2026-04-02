const mongoose = require('mongoose');

// Use the same URI structure as the dispatch-service for production compatibility
const uri = process.env.MONGO_URI || 'mongodb://dispatch_user:dispatch_password@mongo-dispatch:27017/dispatch_db?authSource=admin';

async function migrate() {
  console.log('--- Post-Production Data Migration: Status Normalization ---');
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('vehicles');

    // 1. Audit: Check how many records need updating
    const legacyCount = await collection.countDocuments({ status: 'AVAILABLE' });
    console.log(`Status Audit: Found ${legacyCount} records with 'AVAILABLE' status.`);

    if (legacyCount > 0) {
      // 2. Perform safe update
      const result = await collection.updateMany(
        { status: 'AVAILABLE' },
        { $set: { status: 'READY' } }
      );
      console.log(`✓ Migration Complete: Updated ${result.modifiedCount} records to 'READY'.`);
    } else {
      console.log('No legacy status records found.');
    }

    // 3. Optional: Cleanup redundant field 'is_available' if exists (used in old seed)
    const redundantCount = await collection.countDocuments({ is_available: { $exists: true } });
    if (redundantCount > 0) {
      await collection.updateMany({}, { $unset: { is_available: "" } });
      console.log(`✓ Schema Cleanup: Removed 'is_available' from ${redundantCount} records.`);
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('--- Migration Process Finished ---');
    process.exit(0);
  }
}

migrate();
