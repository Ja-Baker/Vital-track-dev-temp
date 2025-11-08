import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireAdmin = authorize(UserRole.ADMIN);

export const requireNurseOrAdmin = authorize(UserRole.NURSE, UserRole.ADMIN);

export const requireAnyRole = authorize(
  UserRole.ADMIN,
  UserRole.NURSE,
  UserRole.CAREGIVER
);

// Middleware to check if user belongs to the same facility
export const sameFacility = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  // Extract facilityId from request params or body
  const facilityId = req.params.facilityId || req.body.facilityId;

  if (facilityId && facilityId !== req.user.facilityId) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Different facility',
    });
    return;
  }

  next();
};

// Middleware to check resource ownership
export const checkResourceAccess = (resourceType: 'resident' | 'user' | 'alert') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Admins have access to all resources in their facility
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Nurses have access to all resources in their facility
    if (req.user.role === UserRole.NURSE) {
      return next();
    }

    // Caregivers have limited access
    if (req.user.role === UserRole.CAREGIVER) {
      // Implement caregiver-specific access logic here
      // For now, allow access (can be refined based on specific requirements)
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  };
};
