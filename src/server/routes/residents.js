const express = require('express');
const db = require('../../db');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  validatePagination,
  validateEnum,
  sanitizeString,
  validateHours,
  validationError
} = require('../utils/validation');

const router = express.Router();

// Valid status values for residents
const VALID_STATUSES = ['active', 'inactive', 'discharged'];

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search } = req.query;

    // Validate pagination
    const { page, limit, offset } = validatePagination(req.query.page, req.query.limit);

    // Validate status if provided
    if (status) {
      const statusValidation = validateEnum(status, VALID_STATUSES, 'status');
      if (!statusValidation.valid) {
        return res.status(400).json(validationError(statusValidation.error));
      }
    }

    // Sanitize search input
    const sanitizedSearch = sanitizeString(search, 100);

    let query = `
      SELECT 
        r.id, r.first_name, r.last_name, r.date_of_birth, r.gender,
        r.room_number, r.photo_url, r.status, r.admission_date,
        r.medical_conditions, r.allergies,
        d.id as device_id, d.battery_level, d.signal_strength, d.last_sync_at, d.status as device_status,
        (
          SELECT json_build_object(
            'heartRate', v.heart_rate,
            'spo2', v.spo2,
            'systolic', v.systolic,
            'diastolic', v.diastolic,
            'temperature', v.temperature,
            'steps', v.steps,
            'locationDescription', v.location_description,
            'timestamp', v.timestamp
          )
          FROM vital_readings v
          WHERE v.resident_id = r.id
          ORDER BY v.timestamp DESC
          LIMIT 1
        ) as latest_vitals,
        (
          SELECT COUNT(*) FROM alerts a 
          WHERE a.resident_id = r.id AND a.status = 'pending'
        )::int as active_alerts
      FROM residents r
      LEFT JOIN devices d ON d.resident_id = r.id
      WHERE r.facility_id = $1
    `;

    const params = [req.user.facility_id];
    let paramIndex = 2;

    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (sanitizedSearch) {
      query += ` AND (r.first_name ILIKE $${paramIndex} OR r.last_name ILIKE $${paramIndex} OR r.room_number ILIKE $${paramIndex})`;
      params.push(`%${sanitizedSearch}%`);
      paramIndex++;
    }

    if (req.user.role === 'family' && req.user.resident_id) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(req.user.resident_id);
      paramIndex++;
    }

    query += ` ORDER BY r.room_number ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countQuery = `SELECT COUNT(*) FROM residents WHERE facility_id = $1`;
    const countResult = await db.query(countQuery, [req.user.facility_id]);
    const total = parseInt(countResult.rows[0].count);

    const residents = result.rows.map(r => {
      let currentStatus = 'normal';
      if (r.latest_vitals) {
        const v = r.latest_vitals;
        if (v.spo2 && v.spo2 < 90) currentStatus = 'critical';
        else if (v.heartRate && (v.heartRate < 50 || v.heartRate > 120)) currentStatus = 'warning';
        else if (v.spo2 && v.spo2 < 94) currentStatus = 'warning';
      }
      if (r.active_alerts > 0) currentStatus = 'warning';

      return {
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        dateOfBirth: r.date_of_birth,
        gender: r.gender,
        roomNumber: r.room_number,
        photoUrl: r.photo_url,
        status: r.status,
        currentStatus,
        admissionDate: r.admission_date,
        medicalConditions: r.medical_conditions || [],
        allergies: r.allergies || [],
        latestVitals: r.latest_vitals ? {
          heartRate: r.latest_vitals.heartRate,
          spo2: r.latest_vitals.spo2,
          bloodPressure: r.latest_vitals.systolic ? {
            systolic: r.latest_vitals.systolic,
            diastolic: r.latest_vitals.diastolic
          } : null,
          temperature: r.latest_vitals.temperature,
          steps: r.latest_vitals.steps,
          locationDescription: r.latest_vitals.locationDescription,
          timestamp: r.latest_vitals.timestamp
        } : null,
        device: r.device_id ? {
          id: r.device_id,
          batteryLevel: r.battery_level,
          signalStrength: r.signal_strength,
          lastSyncAt: r.last_sync_at,
          status: r.device_status
        } : null,
        activeAlerts: r.active_alerts
      };
    });

    res.json({
      residents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get residents error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get residents' } });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'family' && req.user.resident_id !== id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const result = await db.query(`
      SELECT 
        r.*,
        d.id as device_id, d.device_id as device_imei, d.model, d.firmware_version,
        d.battery_level, d.signal_strength, d.last_sync_at, d.status as device_status
      FROM residents r
      LEFT JOIN devices d ON d.resident_id = r.id
      WHERE r.id = $1 AND r.facility_id = $2
    `, [id, req.user.facility_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resident not found' } });
    }

    const r = result.rows[0];

    const resident = {
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      dateOfBirth: r.date_of_birth,
      gender: r.gender,
      roomNumber: r.room_number,
      photoUrl: r.photo_url,
      status: r.status,
      admissionDate: r.admission_date,
      medicalConditions: r.medical_conditions || [],
      medications: r.medications || [],
      allergies: r.allergies || [],
      emergencyContacts: r.emergency_contacts || [],
      customThresholds: r.custom_thresholds,
      device: r.device_id ? {
        id: r.device_id,
        deviceId: r.device_imei,
        model: r.model,
        firmwareVersion: r.firmware_version,
        batteryLevel: r.battery_level,
        signalStrength: r.signal_strength,
        lastSyncAt: r.last_sync_at,
        status: r.device_status
      } : null
    };

    res.json(resident);
  } catch (error) {
    console.error('Get resident error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get resident' } });
  }
});

router.get('/:id/vitals/latest', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT * FROM vital_readings
      WHERE resident_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.json({ residentId: id, vitals: null });
    }

    const v = result.rows[0];

    res.json({
      residentId: id,
      timestamp: v.timestamp,
      vitals: {
        heartRate: v.heart_rate,
        hrv: v.hrv,
        spo2: v.spo2,
        bloodPressure: v.systolic ? { systolic: v.systolic, diastolic: v.diastolic } : null,
        temperature: v.temperature,
        respiratoryRate: v.respiratory_rate
      },
      activity: {
        steps: v.steps
      },
      location: {
        description: v.location_description,
        latitude: v.latitude,
        longitude: v.longitude,
        insideGeofence: v.inside_geofence
      },
      device: {
        batteryLevel: v.battery_level,
        signalStrength: v.signal_strength
      }
    });
  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get vitals' } });
  }
});

router.get('/:id/vitals/history', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const hours = validateHours(req.query.hours);

    const result = await db.query(`
      SELECT * FROM vital_readings
      WHERE resident_id = $1 AND timestamp >= NOW() - INTERVAL '1 hour' * $2
      ORDER BY timestamp ASC
    `, [id, hours]);

    res.json({
      vitals: result.rows.map(v => ({
        recordedAt: v.timestamp,
        heartRate: v.heart_rate,
        spo2: v.spo2,
        temperature: v.temperature
      }))
    });
  } catch (error) {
    console.error('Get vitals history error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get vitals history' } });
  }
});

router.get('/:id/vitals', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, type } = req.query;

    // Validate and limit the limit parameter
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 100));

    let query = `
      SELECT * FROM vital_readings
      WHERE resident_id = $1
    `;
    const params = [id];
    let paramIndex = 2;

    if (from) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);

    const data = result.rows.map(v => ({
      timestamp: v.timestamp,
      heartRate: v.heart_rate,
      spo2: v.spo2,
      bloodPressure: v.systolic ? { systolic: v.systolic, diastolic: v.diastolic } : null,
      temperature: v.temperature,
      steps: v.steps
    }));

    res.json({
      residentId: id,
      from,
      to,
      data
    });
  } catch (error) {
    console.error('Get vitals history error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get vitals history' } });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, roomNumber, medicalConditions, allergies } = req.body;

    const result = await db.query(`
      INSERT INTO residents (facility_id, first_name, last_name, date_of_birth, gender, room_number, medical_conditions, allergies)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.facility_id, firstName, lastName, dateOfBirth, gender, roomNumber, medicalConditions || [], allergies || []]);

    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      dateOfBirth: r.date_of_birth,
      gender: r.gender,
      roomNumber: r.room_number,
      status: r.status
    });
  } catch (error) {
    console.error('Create resident error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create resident' } });
  }
});

module.exports = router;
