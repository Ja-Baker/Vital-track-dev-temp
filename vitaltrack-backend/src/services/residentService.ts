import { Op } from 'sequelize';
import { Resident, ResidentThreshold, Vital, Alert } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

interface CreateResidentData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  roomNumber?: string;
  facilityId: string;
  garminDeviceId?: string;
  photoUrl?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface UpdateResidentData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  roomNumber?: string;
  garminDeviceId?: string;
  photoUrl?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive?: boolean;
}

interface ResidentFilters {
  facilityId: string;
  search?: string;
  isActive?: boolean;
  roomNumber?: string;
}

export class ResidentService {
  async createResident(data: CreateResidentData): Promise<Resident> {
    // Check if Garmin device is already assigned
    if (data.garminDeviceId) {
      const existingDevice = await Resident.findOne({
        where: { garminDeviceId: data.garminDeviceId },
      });

      if (existingDevice) {
        throw new AppError('Garmin device already assigned to another resident', 409);
      }
    }

    // Create resident
    const resident = await Resident.create(data);

    // Create default thresholds
    await ResidentThreshold.create({
      residentId: resident.id,
      heartRateMin: config.alertThresholds.heartRateMin,
      heartRateMax: config.alertThresholds.heartRateMax,
      spo2Min: config.alertThresholds.spo2Min,
      respirationRateMin: config.alertThresholds.respirationRateMin,
      respirationRateMax: config.alertThresholds.respirationRateMax,
      stressLevelMax: config.alertThresholds.stressLevelMax,
    });

    logger.info('Resident created', {
      residentId: resident.id,
      facilityId: data.facilityId,
    });

    return resident;
  }

  async getResidentById(id: string, facilityId: string): Promise<Resident> {
    const resident = await Resident.findOne({
      where: { id, facilityId },
      include: [
        {
          model: ResidentThreshold,
          as: 'threshold',
        },
      ],
    });

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    return resident;
  }

  async getResidents(filters: ResidentFilters, page: number = 1, limit: number = 20): Promise<{ residents: Resident[]; total: number; pages: number }> {
    const { facilityId, search, isActive, roomNumber } = filters;

    const where: any = { facilityId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roomNumber) {
      where.roomNumber = roomNumber;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { roomNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Resident.findAndCountAll({
      where,
      include: [
        {
          model: ResidentThreshold,
          as: 'threshold',
        },
      ],
      limit,
      offset,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });

    return {
      residents: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async updateResident(id: string, facilityId: string, data: UpdateResidentData): Promise<Resident> {
    const resident = await this.getResidentById(id, facilityId);

    // Check if new Garmin device is already assigned
    if (data.garminDeviceId && data.garminDeviceId !== resident.garminDeviceId) {
      const existingDevice = await Resident.findOne({
        where: {
          garminDeviceId: data.garminDeviceId,
          id: { [Op.ne]: id },
        },
      });

      if (existingDevice) {
        throw new AppError('Garmin device already assigned to another resident', 409);
      }
    }

    await resident.update(data);

    logger.info('Resident updated', {
      residentId: resident.id,
      facilityId,
    });

    return resident;
  }

  async deleteResident(id: string, facilityId: string): Promise<void> {
    const resident = await this.getResidentById(id, facilityId);

    // Soft delete
    resident.isActive = false;
    await resident.save();

    logger.info('Resident deactivated', {
      residentId: resident.id,
      facilityId,
    });
  }

  async updateThresholds(residentId: string, facilityId: string, data: Partial<ResidentThreshold>): Promise<ResidentThreshold> {
    const resident = await this.getResidentById(residentId, facilityId);

    let threshold = await ResidentThreshold.findOne({
      where: { residentId: resident.id },
    });

    if (!threshold) {
      // Create if doesn't exist
      threshold = await ResidentThreshold.create({
        residentId: resident.id,
        ...data,
      });
    } else {
      await threshold.update(data);
    }

    logger.info('Resident thresholds updated', {
      residentId: resident.id,
      facilityId,
    });

    return threshold;
  }

  async getResidentWithLatestVitals(id: string, facilityId: string): Promise<any> {
    const resident = await this.getResidentById(id, facilityId);

    // Get latest vital
    const latestVital = await Vital.findOne({
      where: { residentId: id },
      order: [['timestamp', 'DESC']],
    });

    // Get active alerts count
    const activeAlertsCount = await Alert.count({
      where: {
        residentId: id,
        status: { [Op.in]: ['active', 'acknowledged'] },
      },
    });

    return {
      ...resident.toJSON(),
      latestVital: latestVital ? latestVital.toJSON() : null,
      activeAlertsCount,
    };
  }

  async getResidentsWithStatus(facilityId: string): Promise<any[]> {
    const residents = await Resident.findAll({
      where: { facilityId, isActive: true },
      include: [
        {
          model: ResidentThreshold,
          as: 'threshold',
        },
      ],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });

    // Get latest vitals and alerts for all residents
    const residentsWithStatus = await Promise.all(
      residents.map(async (resident) => {
        const latestVital = await Vital.findOne({
          where: { residentId: resident.id },
          order: [['timestamp', 'DESC']],
        });

        const activeAlerts = await Alert.findAll({
          where: {
            residentId: resident.id,
            status: { [Op.in]: ['active', 'acknowledged'] },
          },
          order: [['alertType', 'ASC'], ['createdAt', 'DESC']],
          limit: 5,
        });

        // Determine status based on alerts
        let status = 'normal';
        if (activeAlerts.some(alert => alert.alertType === 'critical')) {
          status = 'critical';
        } else if (activeAlerts.some(alert => alert.alertType === 'warning')) {
          status = 'warning';
        }

        return {
          ...resident.toJSON(),
          latestVital: latestVital ? latestVital.toJSON() : null,
          activeAlerts: activeAlerts.map(alert => alert.toJSON()),
          status,
        };
      })
    );

    return residentsWithStatus;
  }
}

export default new ResidentService();
