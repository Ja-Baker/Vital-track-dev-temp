import { Request, Response } from 'express';
import residentService from '../services/residentService';
import { asyncHandler } from '../middleware/errorHandler';

export const createResident = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const data = { ...req.body, facilityId };

  const resident = await residentService.createResident(data);

  res.status(201).json({
    success: true,
    message: 'Resident created successfully',
    data: { resident },
  });
});

export const getResidents = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const { search, isActive, roomNumber, page = 1, limit = 20 } = req.query;

  const filters = {
    facilityId,
    search: search as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    roomNumber: roomNumber as string,
  };

  const result = await residentService.getResidents(
    filters,
    parseInt(page as string),
    parseInt(limit as string)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getResidentsWithStatus = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;

  const residents = await residentService.getResidentsWithStatus(facilityId);

  res.status(200).json({
    success: true,
    data: { residents },
  });
});

export const getResidentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  const resident = await residentService.getResidentById(id, facilityId);

  res.status(200).json({
    success: true,
    data: { resident },
  });
});

export const getResidentWithVitals = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  const resident = await residentService.getResidentWithLatestVitals(id, facilityId);

  res.status(200).json({
    success: true,
    data: { resident },
  });
});

export const updateResident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;
  const data = req.body;

  const resident = await residentService.updateResident(id, facilityId, data);

  res.status(200).json({
    success: true,
    message: 'Resident updated successfully',
    data: { resident },
  });
});

export const deleteResident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  await residentService.deleteResident(id, facilityId);

  res.status(200).json({
    success: true,
    message: 'Resident deactivated successfully',
  });
});

export const updateThresholds = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;
  const data = req.body;

  const threshold = await residentService.updateThresholds(id, facilityId, data);

  res.status(200).json({
    success: true,
    message: 'Thresholds updated successfully',
    data: { threshold },
  });
});
