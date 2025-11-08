import { Request, Response } from 'express';
import vitalService from '../services/vitalService';
import { asyncHandler } from '../middleware/errorHandler';

export const recordVital = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const data = req.body;

  const vital = await vitalService.recordVital(data, facilityId);

  // Check against thresholds
  const { isNormal, violations } = await vitalService.checkVitalAgainstThresholds(vital);

  // Process vital through alerting engine (async, don't wait)
  const alertingEngine = req.app.get('alertingEngine');
  if (alertingEngine) {
    alertingEngine.processVitalData(vital).catch((error: Error) => {
      // Error is logged in alerting engine
    });
  }

  res.status(201).json({
    success: true,
    message: 'Vital recorded successfully',
    data: {
      vital,
      analysis: {
        isNormal,
        violations,
      },
    },
  });
});

export const getLatestVital = asyncHandler(async (req: Request, res: Response) => {
  const { residentId } = req.params;
  const facilityId = req.user!.facilityId;

  const vital = await vitalService.getLatestVital(residentId, facilityId);

  res.status(200).json({
    success: true,
    data: { vital },
  });
});

export const getVitalHistory = asyncHandler(async (req: Request, res: Response) => {
  const { residentId } = req.params;
  const facilityId = req.user!.facilityId;
  const { startDate, endDate, limit = 100 } = req.query;

  const query = {
    residentId,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    limit: parseInt(limit as string),
  };

  const vitals = await vitalService.getVitalHistory(query, facilityId);

  res.status(200).json({
    success: true,
    data: { vitals, count: vitals.length },
  });
});

export const getVitalStats = asyncHandler(async (req: Request, res: Response) => {
  const { residentId } = req.params;
  const facilityId = req.user!.facilityId;
  const { hours = 24 } = req.query;

  const stats = await vitalService.getVitalStats(
    residentId,
    facilityId,
    parseInt(hours as string)
  );

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

export const getVitalTrends = asyncHandler(async (req: Request, res: Response) => {
  const { residentId } = req.params;
  const facilityId = req.user!.facilityId;
  const { intervalMinutes = 60, hours = 24 } = req.query;

  const trends = await vitalService.getVitalTrends(
    residentId,
    facilityId,
    parseInt(intervalMinutes as string),
    parseInt(hours as string)
  );

  res.status(200).json({
    success: true,
    data: { trends, count: trends.length },
  });
});
