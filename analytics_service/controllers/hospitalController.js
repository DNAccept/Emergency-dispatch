const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

exports.getHospitals = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
  }
  try {
    let hospitals = await Hospital.find();
    if (hospitals.length === 0) {
      // Seed default
      const defaultHosp = new Hospital({ name: 'Korle Bu', total_beds: 200, occupied_beds: 87 });
      await defaultHosp.save();
      hospitals = [defaultHosp];
    }
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateHospitalCapacity = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
  }
  try {
    const { name, occupied_beds, total_beds } = req.body;
    let hospital = await Hospital.findOne({ name });
    
    if (!hospital) {
      hospital = new Hospital({ name, total_beds: total_beds || 200, occupied_beds });
    } else {
      if (occupied_beds !== undefined) hospital.occupied_beds = occupied_beds;
      if (total_beds !== undefined) hospital.total_beds = total_beds;
      hospital.last_updated = Date.now();
    }
    
    await hospital.save();
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

