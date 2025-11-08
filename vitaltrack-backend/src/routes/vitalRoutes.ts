import { Router } from 'express';
import * as vitalController from '../controllers/vitalController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Record new vital
router.post(
  '/',
  validate(schemas.recordVital),
  vitalController.recordVital
);

// Get latest vital for resident
router.get(
  '/resident/:residentId/latest',
  vitalController.getLatestVital
);

// Get vital history for resident
router.get(
  '/resident/:residentId/history',
  vitalController.getVitalHistory
);

// Get vital statistics for resident
router.get(
  '/resident/:residentId/stats',
  vitalController.getVitalStats
);

// Get vital trends for resident
router.get(
  '/resident/:residentId/trends',
  vitalController.getVitalTrends
);

export default router;
