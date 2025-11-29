import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get facility overview statistics
router.get('/overview', analyticsController.getFacilityOverview);

// Get facility-wide vital averages
router.get('/vitals', analyticsController.getFacilityVitalAverages);

// Get alert trends over time
router.get('/alerts/trends', analyticsController.getAlertTrends);

// Get resident health summary
router.get('/residents', analyticsController.getResidentHealthSummary);

export default router;
