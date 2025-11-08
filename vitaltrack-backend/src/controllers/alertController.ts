import { Request, Response } from 'express';
import alertService from '../services/alertService';
import { AlertStatus, AlertType, AlertCategory } from '../models/Alert';
import { asyncHandler } from '../middleware/errorHandler';

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const {
    status,
    alertType,
    category,
    residentId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = req.query;

  const filters = {
    facilityId,
    status: status as AlertStatus | undefined,
    alertType: alertType as AlertType | undefined,
    category: category as AlertCategory | undefined,
    residentId: residentId as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  };

  const result = await alertService.getAlerts(
    filters,
    parseInt(page as string),
    parseInt(limit as string)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getAlertById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  const alert = await alertService.getAlertById(id, facilityId);

  res.status(200).json({
    success: true,
    data: { alert },
  });
});

export const getAlertsByResident = asyncHandler(async (req: Request, res: Response) => {
  const { residentId } = req.params;
  const facilityId = req.user!.facilityId;
  const { limit = 20 } = req.query;

  const alerts = await alertService.getAlertsByResident(
    residentId,
    facilityId,
    parseInt(limit as string)
  );

  res.status(200).json({
    success: true,
    data: { alerts, count: alerts.length },
  });
});

export const acknowledgeAlert = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const facilityId = req.user!.facilityId;

  const alert = await alertService.acknowledgeAlert(id, userId, facilityId);

  res.status(200).json({
    success: true,
    message: 'Alert acknowledged successfully',
    data: { alert },
  });
});

export const resolveAlert = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const facilityId = req.user!.facilityId;
  const { resolutionNotes } = req.body;

  const alert = await alertService.resolveAlert(id, userId, facilityId, resolutionNotes);

  res.status(200).json({
    success: true,
    message: 'Alert resolved successfully',
    data: { alert },
  });
});

export const escalateAlert = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  const alert = await alertService.escalateAlert(id, facilityId);

  res.status(200).json({
    success: true,
    message: 'Alert escalated successfully',
    data: { alert },
  });
});

export const getActiveAlertsCount = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;

  const counts = await alertService.getActiveAlertsCount(facilityId);

  res.status(200).json({
    success: true,
    data: { counts },
  });
});

export const getAlertStatistics = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const { days = 7 } = req.query;

  const statistics = await alertService.getAlertStatistics(
    facilityId,
    parseInt(days as string)
  );

  res.status(200).json({
    success: true,
    data: { statistics },
  });
});
