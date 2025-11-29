import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Register device token for push notifications (any authenticated user)
// Must be before /:id routes to avoid conflict
router.post(
  '/device-token',
  userController.registerDeviceToken
);

// Unregister device token (any authenticated user)
router.delete(
  '/device-token',
  userController.unregisterDeviceToken
);

// Get all users (admin only)
router.get(
  '/',
  requireAdmin,
  userController.getUsers
);

// Get user by ID (admin only)
router.get(
  '/:id',
  requireAdmin,
  userController.getUserById
);

// Create user (admin only)
router.post(
  '/',
  requireAdmin,
  validate(schemas.createUser),
  userController.createUser
);

// Update user (admin only)
router.put(
  '/:id',
  requireAdmin,
  validate(schemas.updateUser),
  userController.updateUser
);

// Deactivate user (admin only)
router.delete(
  '/:id',
  requireAdmin,
  userController.deactivateUser
);

// Reset user password (admin only)
router.post(
  '/:id/reset-password',
  requireAdmin,
  userController.resetUserPassword
);

export default router;
