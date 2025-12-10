const jwt = require('jsonwebtoken');
const db = require('../../db');

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set. Using auto-generated secret. Set JWT_SECRET env var for production.');
}

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const result = await db.query(
        'SELECT id, email, first_name, last_name, role, facility_id, resident_id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } });
      }

      req.user = result.rows[0];
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' } });
      }
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Authentication error' } });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }

    next();
  };
};

const checkFacilityAccess = async (req, res, next) => {
  try {
    const facilityId = req.params.facilityId || req.body.facilityId;
    
    if (!facilityId) {
      return next();
    }

    if (req.user.role === 'admin' && req.user.facility_id !== facilityId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this facility' } });
    }

    if (req.user.role === 'caregiver' && req.user.facility_id !== facilityId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this facility' } });
    }

    next();
  } catch (error) {
    console.error('Facility access check error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Access check error' } });
  }
};

module.exports = { authenticate, requireRole, checkFacilityAccess, JWT_SECRET };
