import { Router } from 'express';
import authRoutes from './authRoutes';
import residentRoutes from './residentRoutes';
import vitalRoutes from './vitalRoutes';
import alertRoutes from './alertRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VitalTrack API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/residents', residentRoutes);
router.use('/vitals', vitalRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);

export default router;
