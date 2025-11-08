import { Op } from 'sequelize';
import { Alert, Resident, User, AlertType, AlertStatus, AlertCategory } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger, auditLogger } from '../utils/logger';

interface CreateAlertData {
  residentId: string;
  alertType: AlertType;
  category: AlertCategory;
  message: string;
  vitalData?: any;
}

interface AlertFilters {
  facilityId: string;
  status?: AlertStatus | AlertStatus[];
  alertType?: AlertType;
  category?: AlertCategory;
  residentId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AlertService {
  async createAlert(data: CreateAlertData, facilityId: string): Promise<Alert> {
    // Verify resident belongs to facility
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

    // Check if similar alert already exists and is active
    const existingAlert = await Alert.findOne({
      where: {
        residentId: data.residentId,
        category: data.category,
        status: { [Op.in]: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED] },
        createdAt: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) }, // Within last 5 minutes
      },
    });

    if (existingAlert) {
      // Don't create duplicate alert
      logger.debug('Skipping duplicate alert', {
        residentId: data.residentId,
        category: data.category,
      });
      return existingAlert;
    }

    // Create alert
    const alert = await Alert.create(data);

    logger.warn('Alert created', {
      alertId: alert.id,
      residentId: data.residentId,
      alertType: data.alertType,
      category: data.category,
      facilityId,
    });

    auditLogger.info('Health alert generated', {
      alertId: alert.id,
      residentId: data.residentId,
      residentName: resident.fullName,
      alertType: data.alertType,
      category: data.category,
      message: data.message,
      facilityId,
    });

    return alert;
  }

  async getAlertById(id: string, facilityId: string): Promise<Alert> {
    const alert = await Alert.findOne({
      where: { id },
      include: [
        {
          model: Resident,
          as: 'resident',
          where: { facilityId },
        },
        {
          model: User,
          as: 'acknowledger',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    return alert;
  }

  async getAlerts(filters: AlertFilters, page: number = 1, limit: number = 50): Promise<{ alerts: Alert[]; total: number; pages: number }> {
    const { facilityId, status, alertType, category, residentId, startDate, endDate } = filters;

    const where: any = {};

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    if (category) {
      where.category = category;
    }

    if (residentId) {
      where.residentId = residentId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Alert.findAndCountAll({
      where,
      include: [
        {
          model: Resident,
          as: 'resident',
          where: { facilityId },
          attributes: ['id', 'firstName', 'lastName', 'roomNumber'],
        },
        {
          model: User,
          as: 'acknowledger',
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [
        ['status', 'ASC'],
        ['alertType', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    return {
      alerts: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async acknowledgeAlert(alertId: string, userId: string, facilityId: string): Promise<Alert> {
    const alert = await this.getAlertById(alertId, facilityId);

    if (alert.status !== AlertStatus.ACTIVE) {
      throw new AppError('Alert is not in active status', 400);
    }

    // Verify user belongs to facility
    const user = await User.findOne({
      where: { id: userId, facilityId, isActive: true },
    });

    if (!user) {
      throw new AppError('User not found or inactive', 404);
    }

    await alert.acknowledge(userId);

    logger.info('Alert acknowledged', {
      alertId: alert.id,
      userId,
      responseTime: alert.getResponseTime(),
    });

    auditLogger.info('Alert acknowledged', {
      alertId: alert.id,
      residentId: alert.residentId,
      acknowledgedBy: user.fullName,
      userId,
      facilityId,
    });

    return alert;
  }

  async resolveAlert(alertId: string, userId: string, facilityId: string, resolutionNotes?: string): Promise<Alert> {
    const alert = await this.getAlertById(alertId, facilityId);

    if (alert.status === AlertStatus.RESOLVED) {
      throw new AppError('Alert is already resolved', 400);
    }

    // Verify user belongs to facility
    const user = await User.findOne({
      where: { id: userId, facilityId, isActive: true },
    });

    if (!user) {
      throw new AppError('User not found or inactive', 404);
    }

    await alert.resolve(userId, resolutionNotes);

    logger.info('Alert resolved', {
      alertId: alert.id,
      userId,
      resolutionTime: alert.getResolutionTime(),
    });

    auditLogger.info('Alert resolved', {
      alertId: alert.id,
      residentId: alert.residentId,
      resolvedBy: user.fullName,
      userId,
      resolutionNotes,
      facilityId,
    });

    return alert;
  }

  async escalateAlert(alertId: string, facilityId: string): Promise<Alert> {
    const alert = await this.getAlertById(alertId, facilityId);

    if (alert.status === AlertStatus.RESOLVED) {
      throw new AppError('Cannot escalate resolved alert', 400);
    }

    if (alert.status === AlertStatus.ESCALATED) {
      throw new AppError('Alert is already escalated', 400);
    }

    await alert.escalate();

    logger.warn('Alert escalated', {
      alertId: alert.id,
      residentId: alert.residentId,
    });

    auditLogger.warn('Alert escalated', {
      alertId: alert.id,
      residentId: alert.residentId,
      alertType: alert.alertType,
      category: alert.category,
      facilityId,
    });

    return alert;
  }

  async getActiveAlertsCount(facilityId: string): Promise<{
    total: number;
    critical: number;
    warning: number;
    info: number;
  }> {
    const activeStatuses = [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED];

    const [total, critical, warning, info] = await Promise.all([
      Alert.count({
        where: { status: { [Op.in]: activeStatuses } },
        include: [{
          model: Resident,
          as: 'resident',
          where: { facilityId },
          attributes: [],
        }],
      }),
      Alert.count({
        where: { status: { [Op.in]: activeStatuses }, alertType: AlertType.CRITICAL },
        include: [{
          model: Resident,
          as: 'resident',
          where: { facilityId },
          attributes: [],
        }],
      }),
      Alert.count({
        where: { status: { [Op.in]: activeStatuses }, alertType: AlertType.WARNING },
        include: [{
          model: Resident,
          as: 'resident',
          where: { facilityId },
          attributes: [],
        }],
      }),
      Alert.count({
        where: { status: { [Op.in]: activeStatuses }, alertType: AlertType.INFO },
        include: [{
          model: Resident,
          as: 'resident',
          where: { facilityId },
          attributes: [],
        }],
      }),
    ]);

    return { total, critical, warning, info };
  }

  async getAlertsByResident(residentId: string, facilityId: string, limit: number = 20): Promise<Alert[]> {
    // Verify resident belongs to facility
    const resident = await Resident.findOne({
      where: { id: residentId, facilityId },
    });

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    const alerts = await Alert.findAll({
      where: { residentId },
      include: [
        {
          model: User,
          as: 'acknowledger',
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
      ],
      limit,
      order: [['createdAt', 'DESC']],
    });

    return alerts;
  }

  async getAlertStatistics(facilityId: string, days: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await Alert.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
      },
      include: [
        {
          model: Resident,
          as: 'resident',
          where: { facilityId },
          attributes: [],
        },
      ],
    });

    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.alertType === AlertType.CRITICAL).length;
    const warningAlerts = alerts.filter(a => a.alertType === AlertType.WARNING).length;
    const resolvedAlerts = alerts.filter(a => a.status === AlertStatus.RESOLVED).length;

    const responseTimes = alerts
      .filter(a => a.getResponseTime() !== null)
      .map(a => a.getResponseTime()!);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null;

    const resolutionTimes = alerts
      .filter(a => a.getResolutionTime() !== null)
      .map(a => a.getResolutionTime()!);

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : null;

    return {
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      resolvedAlerts,
      activeAlerts: totalAlerts - resolvedAlerts,
      avgResponseTime: avgResponseTime ? Math.round(avgResponseTime / 1000) : null, // in seconds
      avgResolutionTime: avgResolutionTime ? Math.round(avgResolutionTime / 1000) : null, // in seconds
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
    };
  }
}

export default new AlertService();
