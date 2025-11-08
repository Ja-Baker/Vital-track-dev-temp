import { Op } from 'sequelize';
import { Vital, Resident, ResidentThreshold } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface RecordVitalData {
  residentId: string;
  timestamp?: Date;
  heartRate?: number;
  spo2?: number;
  respirationRate?: number;
  stressLevel?: number;
  steps?: number;
  calories?: number;
  source?: string;
  rawData?: any;
}

interface VitalQuery {
  residentId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface VitalStats {
  avgHeartRate: number | null;
  minHeartRate: number | null;
  maxHeartRate: number | null;
  avgSpo2: number | null;
  minSpo2: number | null;
  avgRespirationRate: number | null;
  avgStressLevel: number | null;
  totalSteps: number | null;
  totalCalories: number | null;
  dataPoints: number;
}

export class VitalService {
  async recordVital(data: RecordVitalData, facilityId: string): Promise<Vital> {
    // Verify resident exists and belongs to facility
    const resident = await Resident.findOne({
      where: {
        id: data.residentId,
        facilityId,
        isActive: true,
      },
    });

    if (!resident) {
      throw new AppError('Resident not found or inactive', 404);
    }

    // Create vital record
    const vital = await Vital.create({
      ...data,
      timestamp: data.timestamp || new Date(),
      source: data.source || 'garmin_companion_sdk',
    });

    logger.info('Vital recorded', {
      vitalId: vital.id,
      residentId: data.residentId,
      facilityId,
    });

    return vital;
  }

  async getLatestVital(residentId: string, facilityId: string): Promise<Vital | null> {
    // Verify resident belongs to facility
    const resident = await Resident.findOne({
      where: { id: residentId, facilityId },
    });

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    const vital = await Vital.findOne({
      where: { residentId },
      order: [['timestamp', 'DESC']],
    });

    return vital;
  }

  async getVitalHistory(query: VitalQuery, facilityId: string): Promise<Vital[]> {
    const { residentId, startDate, endDate, limit = 100 } = query;

    // Verify resident belongs to facility
    const resident = await Resident.findOne({
      where: { id: residentId, facilityId },
    });

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    const where: any = { residentId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = startDate;
      if (endDate) where.timestamp[Op.lte] = endDate;
    }

    const vitals = await Vital.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit,
    });

    return vitals;
  }

  async getVitalStats(residentId: string, facilityId: string, hours: number = 24): Promise<VitalStats> {
    // Verify resident belongs to facility
    const resident = await Resident.findOne({
      where: { id: residentId, facilityId },
    });

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const vitals = await Vital.findAll({
      where: {
        residentId,
        timestamp: { [Op.gte]: startDate },
      },
      order: [['timestamp', 'ASC']],
    });

    if (vitals.length === 0) {
      return {
        avgHeartRate: null,
        minHeartRate: null,
        maxHeartRate: null,
        avgSpo2: null,
        minSpo2: null,
        avgRespirationRate: null,
        avgStressLevel: null,
        totalSteps: null,
        totalCalories: null,
        dataPoints: 0,
      };
    }

    // Calculate statistics
    const heartRates = vitals.map(v => v.heartRate).filter(v => v !== null) as number[];
    const spo2Values = vitals.map(v => v.spo2).filter(v => v !== null) as number[];
    const respirationRates = vitals.map(v => v.respirationRate).filter(v => v !== null) as number[];
    const stressLevels = vitals.map(v => v.stressLevel).filter(v => v !== null) as number[];
    const steps = vitals.map(v => v.steps).filter(v => v !== null) as number[];
    const calories = vitals.map(v => v.calories).filter(v => v !== null) as number[];

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : null;
    const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : null;
    const sum = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : null;

    return {
      avgHeartRate: avg(heartRates),
      minHeartRate: min(heartRates),
      maxHeartRate: max(heartRates),
      avgSpo2: avg(spo2Values),
      minSpo2: min(spo2Values),
      avgRespirationRate: avg(respirationRates),
      avgStressLevel: avg(stressLevels),
      totalSteps: sum(steps),
      totalCalories: sum(calories),
      dataPoints: vitals.length,
    };
  }

  async getVitalTrends(residentId: string, facilityId: string, intervalMinutes: number = 60, hours: number = 24): Promise<any[]> {
    // Verify resident belongs to facility
    const resident = await Resident.findOne({
      where: { id: residentId, facilityId },
    });

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const vitals = await Vital.findAll({
      where: {
        residentId,
        timestamp: { [Op.gte]: startDate },
      },
      order: [['timestamp', 'ASC']],
    });

    // Group vitals by time intervals
    const intervals: Map<string, Vital[]> = new Map();

    vitals.forEach(vital => {
      const intervalKey = this.getIntervalKey(vital.timestamp, intervalMinutes);
      if (!intervals.has(intervalKey)) {
        intervals.set(intervalKey, []);
      }
      intervals.get(intervalKey)!.push(vital);
    });

    // Calculate averages for each interval
    const trends = Array.from(intervals.entries()).map(([key, vitalGroup]) => {
      const heartRates = vitalGroup.map(v => v.heartRate).filter(v => v !== null) as number[];
      const spo2Values = vitalGroup.map(v => v.spo2).filter(v => v !== null) as number[];
      const respirationRates = vitalGroup.map(v => v.respirationRate).filter(v => v !== null) as number[];
      const stressLevels = vitalGroup.map(v => v.stressLevel).filter(v => v !== null) as number[];

      const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

      return {
        timestamp: key,
        avgHeartRate: avg(heartRates),
        avgSpo2: avg(spo2Values),
        avgRespirationRate: avg(respirationRates),
        avgStressLevel: avg(stressLevels),
        dataPoints: vitalGroup.length,
      };
    });

    return trends;
  }

  private getIntervalKey(date: Date, intervalMinutes: number): string {
    const timestamp = date.getTime();
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalStart = Math.floor(timestamp / intervalMs) * intervalMs;
    return new Date(intervalStart).toISOString();
  }

  async deleteOldVitals(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const deletedCount = await Vital.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate },
      },
    });

    logger.info('Old vitals deleted', {
      deletedCount,
      cutoffDate,
    });

    return deletedCount;
  }

  async checkVitalAgainstThresholds(vital: Vital): Promise<{
    isNormal: boolean;
    violations: string[];
  }> {
    const threshold = await ResidentThreshold.findOne({
      where: { residentId: vital.residentId },
    });

    if (!threshold) {
      return { isNormal: true, violations: [] };
    }

    const violations: string[] = [];

    if (vital.heartRate !== null) {
      if (!threshold.isHeartRateNormal(vital.heartRate)) {
        violations.push(`Heart rate ${vital.heartRate} BPM is out of range (${threshold.heartRateMin}-${threshold.heartRateMax})`);
      }
    }

    if (vital.spo2 !== null) {
      if (!threshold.isSpO2Normal(vital.spo2)) {
        violations.push(`Blood oxygen ${vital.spo2}% is below threshold (${threshold.spo2Min}%)`);
      }
    }

    if (vital.respirationRate !== null) {
      if (!threshold.isRespirationRateNormal(vital.respirationRate)) {
        violations.push(`Respiration rate ${vital.respirationRate} is out of range (${threshold.respirationRateMin}-${threshold.respirationRateMax})`);
      }
    }

    if (vital.stressLevel !== null) {
      if (!threshold.isStressLevelNormal(vital.stressLevel)) {
        violations.push(`Stress level ${vital.stressLevel} is above threshold (${threshold.stressLevelMax})`);
      }
    }

    return {
      isNormal: violations.length === 0,
      violations,
    };
  }
}

export default new VitalService();
