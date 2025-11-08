import { Router } from 'express';
import * as residentController from '../controllers/residentController';
import { authenticate } from '../middleware/auth';
import { authorize, requireAdmin, requireNurseOrAdmin } from '../middleware/authorization';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all residents with status (dashboard view)
router.get(
  '/with-status',
  residentController.getResidentsWithStatus
);

// GET all residents
router.get(
  '/',
  residentController.getResidents
);

// GET resident by ID
router.get(
  '/:id',
  residentController.getResidentById
);

// GET resident with latest vitals
router.get(
  '/:id/with-vitals',
  residentController.getResidentWithVitals
);

// CREATE resident (admin or nurse only)
router.post(
  '/',
  requireNurseOrAdmin,
  validate(schemas.createResident),
  residentController.createResident
);

// UPDATE resident (admin or nurse only)
router.put(
  '/:id',
  requireNurseOrAdmin,
  validate(schemas.updateResident),
  residentController.updateResident
);

// DELETE/deactivate resident (admin only)
router.delete(
  '/:id',
  requireAdmin,
  residentController.deleteResident
);

// UPDATE resident thresholds (admin or nurse only)
router.put(
  '/:id/thresholds',
  requireNurseOrAdmin,
  validate(schemas.updateThresholds),
  residentController.updateThresholds
);

export default router;
