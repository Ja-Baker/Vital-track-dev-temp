const express = require('express');
const db = require('../../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, category, residentId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.*,
        r.first_name, r.last_name, r.room_number
      FROM alerts a
      JOIN residents r ON r.id = a.resident_id
      WHERE a.facility_id = $1
    `;

    const params = [req.user.facility_id];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND a.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category) {
      query += ` AND a.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (residentId) {
      query += ` AND a.resident_id = $${paramIndex}`;
      params.push(residentId);
      paramIndex++;
    }

    if (req.user.role === 'family' && req.user.resident_id) {
      query += ` AND a.resident_id = $${paramIndex} AND a.type = 'critical'`;
      params.push(req.user.resident_id);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END,
      CASE WHEN a.type = 'critical' THEN 0 WHEN a.type = 'warning' THEN 1 ELSE 2 END,
      a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM alerts
      WHERE facility_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
    `, [req.user.facility_id]);

    const alerts = result.rows.map(a => ({
      id: a.id,
      residentId: a.resident_id,
      residentName: `${a.first_name} ${a.last_name}`,
      roomNumber: a.room_number,
      type: a.type,
      category: a.category,
      title: a.title,
      message: a.message,
      status: a.status,
      triggeringValue: a.triggering_value,
      acknowledgedBy: a.acknowledged_by,
      acknowledgedAt: a.acknowledged_at,
      resolvedBy: a.resolved_by,
      resolvedAt: a.resolved_at,
      createdAt: a.created_at
    }));

    res.json({
      alerts,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get alerts' } });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        a.*,
        r.first_name, r.last_name, r.room_number,
        ack.first_name as ack_first_name, ack.last_name as ack_last_name,
        res.first_name as res_first_name, res.last_name as res_last_name
      FROM alerts a
      JOIN residents r ON r.id = a.resident_id
      LEFT JOIN users ack ON ack.id = a.acknowledged_by
      LEFT JOIN users res ON res.id = a.resolved_by
      WHERE a.id = $1 AND a.facility_id = $2
    `, [id, req.user.facility_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Alert not found' } });
    }

    const a = result.rows[0];

    res.json({
      id: a.id,
      residentId: a.resident_id,
      residentName: `${a.first_name} ${a.last_name}`,
      roomNumber: a.room_number,
      type: a.type,
      category: a.category,
      title: a.title,
      message: a.message,
      status: a.status,
      triggeringValue: a.triggering_value,
      acknowledgedBy: a.acknowledged_by ? {
        id: a.acknowledged_by,
        name: `${a.ack_first_name} ${a.ack_last_name}`
      } : null,
      acknowledgedAt: a.acknowledged_at,
      resolvedBy: a.resolved_by ? {
        id: a.resolved_by,
        name: `${a.res_first_name} ${a.res_last_name}`
      } : null,
      resolvedAt: a.resolved_at,
      outcome: a.outcome,
      notes: a.notes,
      createdAt: a.created_at
    });
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get alert' } });
  }
});

router.post('/:id/acknowledge', authenticate, requireRole('admin', 'caregiver'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE alerts 
      SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND facility_id = $3 AND status = 'pending'
      RETURNING *
    `, [req.user.id, id, req.user.facility_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Alert not found or already acknowledged' } });
    }

    const a = result.rows[0];

    res.json({
      id: a.id,
      status: a.status,
      acknowledgedBy: req.user.id,
      acknowledgedAt: a.acknowledged_at
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to acknowledge alert' } });
  }
});

router.post('/:id/resolve', authenticate, requireRole('admin', 'caregiver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, notes } = req.body;

    const newStatus = outcome === 'false_alarm' ? 'false_alarm' : 'resolved';

    const result = await db.query(`
      UPDATE alerts 
      SET status = $1, resolved_by = $2, resolved_at = NOW(), outcome = $3, notes = $4, updated_at = NOW()
      WHERE id = $5 AND facility_id = $6 AND status IN ('pending', 'acknowledged')
      RETURNING *
    `, [newStatus, req.user.id, outcome, notes, id, req.user.facility_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Alert not found or already resolved' } });
    }

    const a = result.rows[0];

    res.json({
      id: a.id,
      status: a.status,
      resolvedBy: req.user.id,
      resolvedAt: a.resolved_at,
      outcome: a.outcome
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to resolve alert' } });
  }
});

module.exports = router;
