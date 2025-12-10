const express = require('express');
const db = require('../../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        f.*,
        (SELECT COUNT(*) FROM residents r WHERE r.facility_id = f.id AND r.status = 'active') as resident_count
      FROM facilities f
      WHERE f.id = $1
    `, [req.user.facility_id]);

    res.json({
      facilities: result.rows.map(f => ({
        id: f.id,
        name: f.name,
        address: f.address,
        city: f.city,
        state: f.state,
        zip: f.zip,
        timezone: f.timezone,
        phone: f.phone,
        capacity: f.capacity,
        residentCount: parseInt(f.resident_count)
      }))
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get facilities' } });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.facility_id !== id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const result = await db.query(`
      SELECT 
        f.*,
        (SELECT COUNT(*) FROM residents r WHERE r.facility_id = f.id AND r.status = 'active') as resident_count
      FROM facilities f
      WHERE f.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Facility not found' } });
    }

    const f = result.rows[0];

    res.json({
      id: f.id,
      name: f.name,
      address: f.address,
      city: f.city,
      state: f.state,
      zip: f.zip,
      timezone: f.timezone,
      phone: f.phone,
      capacity: f.capacity,
      residentCount: parseInt(f.resident_count)
    });
  } catch (error) {
    console.error('Get facility error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get facility' } });
  }
});

router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.facility_id !== id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const residentStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'hospitalized') as hospitalized,
        COUNT(*) FILTER (WHERE status = 'discharged') as discharged
      FROM residents
      WHERE facility_id = $1
    `, [id]);

    const alertStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
        COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at > NOW() - INTERVAL '24 hours') as resolved_today,
        COUNT(*) FILTER (WHERE type = 'critical' AND status = 'pending') as critical_pending
      FROM alerts
      WHERE facility_id = $1
    `, [id]);

    const deviceStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as online,
        COUNT(*) FILTER (WHERE status = 'offline') as offline,
        COUNT(*) FILTER (WHERE battery_level < 20) as low_battery
      FROM devices
      WHERE facility_id = $1
    `, [id]);

    res.json({
      residents: residentStats.rows[0],
      alerts: alertStats.rows[0],
      devices: deviceStats.rows[0]
    });
  } catch (error) {
    console.error('Get facility stats error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get stats' } });
  }
});

module.exports = router;
