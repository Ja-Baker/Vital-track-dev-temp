const db = require('../../db');

const VITAL_RANGES = {
  heartRate: { min: 55, max: 100, criticalLow: 50, criticalHigh: 120 },
  spo2: { min: 94, max: 99, criticalLow: 90, criticalHigh: 100 },
  systolic: { min: 110, max: 140, criticalLow: 90, criticalHigh: 160 },
  diastolic: { min: 70, max: 90, criticalLow: 60, criticalHigh: 100 },
  temperature: { min: 97.5, max: 99.0, criticalLow: 96.0, criticalHigh: 100.4 }
};

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function generateVital(range, previousValue) {
  if (previousValue) {
    const variance = (range.max - range.min) * 0.1;
    const newValue = previousValue + (Math.random() - 0.5) * variance * 2;
    return Math.round(Math.min(range.max + 5, Math.max(range.min - 5, newValue)) * 10) / 10;
  }
  return randomInRange(range.min, range.max);
}

function checkThresholds(vitals) {
  const alerts = [];
  
  if (vitals.heartRate < VITAL_RANGES.heartRate.criticalLow) {
    alerts.push({ type: 'critical', title: 'Low Heart Rate', message: `Heart rate dangerously low: ${vitals.heartRate} BPM` });
  } else if (vitals.heartRate > VITAL_RANGES.heartRate.criticalHigh) {
    alerts.push({ type: 'critical', title: 'High Heart Rate', message: `Heart rate dangerously high: ${vitals.heartRate} BPM` });
  } else if (vitals.heartRate < VITAL_RANGES.heartRate.min || vitals.heartRate > VITAL_RANGES.heartRate.max) {
    alerts.push({ type: 'warning', title: 'Abnormal Heart Rate', message: `Heart rate outside normal range: ${vitals.heartRate} BPM` });
  }

  if (vitals.spo2 < VITAL_RANGES.spo2.criticalLow) {
    alerts.push({ type: 'critical', title: 'Critical SpO2', message: `Blood oxygen critically low: ${vitals.spo2}%` });
  } else if (vitals.spo2 < VITAL_RANGES.spo2.min) {
    alerts.push({ type: 'warning', title: 'Low SpO2', message: `Blood oxygen below normal: ${vitals.spo2}%` });
  }

  if (vitals.temperature > VITAL_RANGES.temperature.criticalHigh) {
    alerts.push({ type: 'critical', title: 'High Fever', message: `Temperature dangerously high: ${vitals.temperature}°F` });
  } else if (vitals.temperature < VITAL_RANGES.temperature.criticalLow) {
    alerts.push({ type: 'warning', title: 'Low Temperature', message: `Temperature below normal: ${vitals.temperature}°F` });
  } else if (vitals.temperature > VITAL_RANGES.temperature.max) {
    alerts.push({ type: 'warning', title: 'Elevated Temperature', message: `Temperature elevated: ${vitals.temperature}°F` });
  }

  return alerts;
}

async function createAlert(residentId, facilityId, alertData, emitNewAlert) {
  try {
    const result = await db.query(`
      INSERT INTO alerts (resident_id, facility_id, type, severity, title, message, vital_data, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [
      residentId,
      facilityId,
      alertData.type === 'critical' ? 'vital_critical' : 'vital_warning',
      alertData.type,
      alertData.title,
      alertData.message,
      JSON.stringify({})
    ]);

    const alert = result.rows[0];
    
    const residentResult = await db.query(
      'SELECT first_name, last_name, room_number FROM residents WHERE id = $1',
      [residentId]
    );
    
    if (residentResult.rows[0] && emitNewAlert) {
      const resident = residentResult.rows[0];
      emitNewAlert(facilityId, {
        id: alert.id,
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        residentId,
        residentName: `${resident.first_name} ${resident.last_name}`,
        roomNumber: resident.room_number,
        status: 'pending',
        createdAt: alert.created_at
      });
    }

    return alert;
  } catch (error) {
    console.error('Failed to create alert:', error);
    return null;
  }
}

const residentVitals = new Map();

async function simulateVitals(io, emitVitalUpdate, emitNewAlert) {
  try {
    const residentsResult = await db.query(`
      SELECT r.id, r.facility_id, r.first_name, r.last_name, r.room_number
      FROM residents r
      WHERE r.status = 'active'
    `);

    for (const resident of residentsResult.rows) {
      const previousVitals = residentVitals.get(resident.id) || {};
      
      const vitals = {
        heartRate: Math.round(generateVital(VITAL_RANGES.heartRate, previousVitals.heartRate)),
        spo2: Math.round(generateVital(VITAL_RANGES.spo2, previousVitals.spo2)),
        systolic: Math.round(generateVital(VITAL_RANGES.systolic, previousVitals.systolic)),
        diastolic: Math.round(generateVital(VITAL_RANGES.diastolic, previousVitals.diastolic)),
        temperature: generateVital(VITAL_RANGES.temperature, previousVitals.temperature),
        steps: (previousVitals.steps || 0) + Math.floor(Math.random() * 20),
        batteryLevel: Math.max(10, (previousVitals.batteryLevel || 100) - Math.random() * 0.5)
      };

      residentVitals.set(resident.id, vitals);

      await db.query(`
        INSERT INTO vital_readings (
          resident_id, heart_rate, spo2, systolic, diastolic, temperature,
          steps, battery_level, signal_strength, location_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        resident.id,
        vitals.heartRate,
        vitals.spo2,
        vitals.systolic,
        vitals.diastolic,
        vitals.temperature,
        vitals.steps,
        Math.round(vitals.batteryLevel),
        Math.round(80 + Math.random() * 20),
        ['Room', 'Dining Hall', 'Garden', 'Common Area', 'Therapy Room'][Math.floor(Math.random() * 5)]
      ]);

      if (emitVitalUpdate) {
        emitVitalUpdate(resident.facility_id, resident.id, {
          heartRate: vitals.heartRate,
          spo2: vitals.spo2,
          bloodPressure: { systolic: vitals.systolic, diastolic: vitals.diastolic },
          temperature: vitals.temperature,
          steps: vitals.steps,
          timestamp: new Date().toISOString()
        });
      }

      const alertConditions = checkThresholds(vitals);
      for (const alertData of alertConditions) {
        const recentAlert = await db.query(`
          SELECT id FROM alerts 
          WHERE resident_id = $1 AND title = $2 AND status = 'pending'
          AND created_at > NOW() - INTERVAL '30 minutes'
        `, [resident.id, alertData.title]);

        if (recentAlert.rows.length === 0) {
          await createAlert(resident.id, resident.facility_id, alertData, emitNewAlert);
        }
      }
    }
  } catch (error) {
    console.error('Vital simulation error:', error);
  }
}

function startVitalSimulator(io, emitVitalUpdate, emitNewAlert) {
  console.log('Starting vital sign simulator...');
  
  simulateVitals(io, emitVitalUpdate, emitNewAlert);
  
  setInterval(() => {
    simulateVitals(io, emitVitalUpdate, emitNewAlert);
  }, 30000);
}

module.exports = { startVitalSimulator, simulateVitals, checkThresholds };
