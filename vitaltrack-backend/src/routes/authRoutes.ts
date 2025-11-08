import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post(
  '/login',
  validate(schemas.login),
  authController.login
);

router.post(
  '/forgot-password',
  validate(schemas.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(schemas.resetPassword),
  authController.resetPassword
);

router.post(
  '/refresh',
  authController.refreshToken
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.post(
  '/change-password',
  authenticate,
  authController.changePassword
);

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export default router;
