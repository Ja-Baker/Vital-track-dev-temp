import { Router } from 'express';
import * as alertController from '../controllers/alertController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all alerts with filters
router.get(
  '/',
  alertController.getAlerts
);

// Get active alerts count
router.get(
  '/count',
  alertController.getActiveAlertsCount
);

// Get alert statistics
router.get(
  '/stats',
  alertController.getAlertStatistics
);

// Get alert by ID
router.get(
  '/:id',
  alertController.getAlertById
);

// Get alerts for specific resident
router.get(
  '/resident/:residentId',
  alertController.getAlertsByResident
);

// Acknowledge alert
router.post(
  '/:id/acknowledge',
  validate(schemas.acknowledgeAlert),
  alertController.acknowledgeAlert
);

// Resolve alert
router.post(
  '/:id/resolve',
  validate(schemas.resolveAlert),
  alertController.resolveAlert
);

// Escalate alert
router.post(
  '/:id/escalate',
  alertController.escalateAlert
);

export default router;
