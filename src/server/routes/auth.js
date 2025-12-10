const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || require('crypto').randomBytes(32).toString('hex');

if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('WARNING: JWT_REFRESH_SECRET not set. Using auto-generated secret. Set JWT_REFRESH_SECRET env var for production.');
}
const ACCESS_TOKEN_EXPIRY = '30m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, facilityId: user.facility_id },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenType: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const auditLog = async (userId, email, role, action, success, req, metadata = {}) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, ip_address, user_agent, success, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, email, role, action, req.ip, req.headers['user-agent'], success, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } });
    }

    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, facility_id, resident_id, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      await auditLog(null, email, null, 'login_failed', false, req, { reason: 'User not found' });
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      await auditLog(user.id, email, user.role, 'login_failed', false, req, { reason: 'Account inactive' });
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Account is inactive' } });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await auditLog(user.id, email, user.role, 'login_failed', false, req, { reason: 'Invalid password' });
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    await auditLog(user.id, email, user.role, 'login', true, req);

    let facility = null;
    if (user.facility_id) {
      const facilityResult = await db.query('SELECT id, name FROM facilities WHERE id = $1', [user.facility_id]);
      facility = facilityResult.rows[0] || null;
    }

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        facilityId: user.facility_id,
        facility
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, facilityId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'All fields required' } });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' } });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email already registered' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'caregiver';

    let facility = facilityId;
    if (!facility) {
      const defaultFacility = await db.query('SELECT id FROM facilities LIMIT 1');
      facility = defaultFacility.rows[0]?.id;
    }

    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, facility_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, facility_id`,
      [email.toLowerCase(), passwordHash, firstName, lastName, userRole, facility]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    await auditLog(user.id, user.email, user.role, 'register', true, req);

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        facilityId: user.facility_id
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Registration failed' } });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' } });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenResult = await db.query(
      'SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()',
      [decoded.userId, tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Refresh token expired or revoked' } });
    }

    const userResult = await db.query(
      'SELECT id, email, first_name, last_name, role, facility_id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } });
    }

    const user = userResult.rows[0];
    const tokens = generateTokens(user);

    await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);

    const newTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, newTokenHash, expiresAt]
    );

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Token refresh failed' } });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    await auditLog(req.user.id, req.user.email, req.user.role, 'logout', true, req);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Logout failed' } });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    let facility = null;
    if (req.user.facility_id) {
      const facilityResult = await db.query('SELECT id, name FROM facilities WHERE id = $1', [req.user.facility_id]);
      facility = facilityResult.rows[0] || null;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role,
        facilityId: req.user.facility_id,
        facility
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get user' } });
  }
});

module.exports = router;
