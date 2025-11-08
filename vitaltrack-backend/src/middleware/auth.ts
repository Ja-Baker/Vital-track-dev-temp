import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User } from '../models';
import { auditLogger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { userRecord?: User };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);

      if (decoded.type !== 'access') {
        res.status(401).json({
          success: false,
          message: 'Invalid token type',
        });
        return;
      }

      // Optionally fetch full user record
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
        return;
      }

      // Attach user to request
      req.user = { ...decoded, userRecord: user };

      // Audit log for HIPAA compliance
      auditLogger.info('User authenticated', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        facilityId: decoded.facilityId,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      next();
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Token verification failed',
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

export const optional Authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.type === 'access') {
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.user = { ...decoded, userRecord: user };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};
