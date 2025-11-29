import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Vital, Alert, Resident, User } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Get facility overview statistics
export const getFacilityOverview = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;

  // Get counts
  const [totalResidents, activeAlerts, staffCount] = await Promise.all([
    Resident.count({ where: { facilityId, isActive: true } }),
    Alert.count({
      include: [{ model: Resident, where: { facilityId }, attributes: [] }],
      where: { status: 'active' },
    }),
    User.count({ where: { facilityId, isActive: true } }),
  ]);

  // Get residents with recent vitals (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const residentsWithRecentVitals = await Vital.count({
    include: [{ model: Resident, where: { facilityId }, attributes: [] }],
    where: {
      timestamp: { [Op.gte]: oneDayAgo },
    },
    distinct: true,
    col: 'residentId',
  });

  // Get alert counts by type
  const alertsByType = await Alert.findAll({
    include: [{ model: Resident, where: { facilityId }, attributes: [] }],
    where: { status: 'active' },
    attributes: [
      'alertType',
      [fn('COUNT', col('Alert.id')), 'count'],
    ],
    group: ['alertType'],
    raw: true,
  });

  res.status(200).json({
    success: true,
    data: {
      totalResidents,
      activeAlerts,
      staffCount,
      residentsWithRecentVitals,
      monitoringRate: totalResidents > 0
        ? Math.round((residentsWithRecentVitals / totalResidents) * 100)
        : 0,
      alertsByType: alertsByType.reduce((acc: any, item: any) => {
        acc[item.alertType] = parseInt(item.count, 10);
        return acc;
      }, {}),
    },
  });
});

// Get facility-wide vital averages
export const getFacilityVitalAverages = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const { timeRange = '24h' } = req.query;

  // Calculate time range
  let startTime: Date;
  switch (timeRange) {
    case '1h':
      startTime = new Date(Date.now() - 60 * 60 * 1000);
      break;
    case '6h':
      startTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '24h':
    default:
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
  }

  const averages = await Vital.findOne({
    include: [{ model: Resident, where: { facilityId }, attributes: [] }],
    where: {
      timestamp: { [Op.gte]: startTime },
    },
    attributes: [
      [fn('AVG', col('heartRate')), 'avgHeartRate'],
      [fn('AVG', col('spo2')), 'avgSpo2'],
      [fn('AVG', col('respirationRate')), 'avgRespirationRate'],
      [fn('AVG', col('stressLevel')), 'avgStressLevel'],
      [fn('MIN', col('heartRate')), 'minHeartRate'],
      [fn('MAX', col('heartRate')), 'maxHeartRate'],
      [fn('MIN', col('spo2')), 'minSpo2'],
      [fn('MAX', col('spo2')), 'maxSpo2'],
      [fn('COUNT', col('Vital.id')), 'totalReadings'],
    ],
    raw: true,
  }) as any;

  res.status(200).json({
    success: true,
    data: {
      timeRange,
      averages: {
        heartRate: {
          avg: averages?.avgHeartRate ? Math.round(parseFloat(averages.avgHeartRate)) : null,
          min: averages?.minHeartRate ? parseInt(averages.minHeartRate, 10) : null,
          max: averages?.maxHeartRate ? parseInt(averages.maxHeartRate, 10) : null,
        },
        spo2: {
          avg: averages?.avgSpo2 ? Math.round(parseFloat(averages.avgSpo2) * 10) / 10 : null,
          min: averages?.minSpo2 ? parseFloat(averages.minSpo2) : null,
          max: averages?.maxSpo2 ? parseFloat(averages.maxSpo2) : null,
        },
        respirationRate: {
          avg: averages?.avgRespirationRate ? Math.round(parseFloat(averages.avgRespirationRate)) : null,
        },
        stressLevel: {
          avg: averages?.avgStressLevel ? Math.round(parseFloat(averages.avgStressLevel)) : null,
        },
      },
      totalReadings: averages?.totalReadings ? parseInt(averages.totalReadings, 10) : 0,
    },
  });
});

// Get alert trends over time
export const getAlertTrends = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const { days = 7 } = req.query;

  const startDate = new Date(Date.now() - parseInt(days as string, 10) * 24 * 60 * 60 * 1000);

  // Get alerts grouped by day
  const alertTrends = await Alert.findAll({
    include: [{ model: Resident, where: { facilityId }, attributes: [] }],
    where: {
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [fn('DATE', col('Alert.created_at')), 'date'],
      'alertType',
      [fn('COUNT', col('Alert.id')), 'count'],
    ],
    group: [fn('DATE', col('Alert.created_at')), 'alertType'],
    order: [[fn('DATE', col('Alert.created_at')), 'ASC']],
    raw: true,
  });

  // Get resolution times
  const resolutionStats = await Alert.findOne({
    include: [{ model: Resident, where: { facilityId }, attributes: [] }],
    where: {
      status: 'resolved',
      resolvedAt: { [Op.ne]: null },
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [fn('AVG', literal('EXTRACT(EPOCH FROM ("Alert"."resolved_at" - "Alert"."created_at"))')), 'avgResolutionTime'],
    ],
    raw: true,
  }) as any;

  res.status(200).json({
    success: true,
    data: {
      trends: alertTrends,
      averageResolutionTime: resolutionStats?.avgResolutionTime
        ? Math.round(parseFloat(resolutionStats.avgResolutionTime) / 60) // Convert to minutes
        : null,
    },
  });
});

// Get resident health summary
export const getResidentHealthSummary = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;

  const residents = await Resident.findAll({
    where: { facilityId, isActive: true },
    attributes: ['id', 'firstName', 'lastName', 'roomNumber'],
  });

  const residentIds = residents.map((r) => r.id);

  // Get latest vital for each resident
  const latestVitals = await Promise.all(
    residentIds.map(async (residentId) => {
      const vital = await Vital.findOne({
        where: { residentId },
        order: [['timestamp', 'DESC']],
        limit: 1,
      });
      return { residentId, vital };
    })
  );

  // Get active alert count per resident
  const alertCounts = await Alert.findAll({
    where: {
      residentId: { [Op.in]: residentIds },
      status: 'active',
    },
    attributes: ['residentId', [fn('COUNT', col('id')), 'alertCount']],
    group: ['residentId'],
    raw: true,
  }) as any[];

  const alertCountMap = alertCounts.reduce((acc: any, item: any) => {
    acc[item.residentId] = parseInt(item.alertCount, 10);
    return acc;
  }, {});

  const vitalMap = latestVitals.reduce((acc: any, item) => {
    acc[item.residentId] = item.vital;
    return acc;
  }, {});

  const summary = residents.map((resident) => ({
    id: resident.id,
    name: `${resident.firstName} ${resident.lastName}`,
    roomNumber: resident.roomNumber,
    latestVital: vitalMap[resident.id] || null,
    activeAlerts: alertCountMap[resident.id] || 0,
    status: alertCountMap[resident.id] > 0
      ? 'alert'
      : vitalMap[resident.id]
        ? 'normal'
        : 'no_data',
  }));

  res.status(200).json({
    success: true,
    data: { residents: summary },
  });
});
