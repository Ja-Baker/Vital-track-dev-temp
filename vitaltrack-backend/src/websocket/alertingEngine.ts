import { Server } from 'socket.io';
import { Vital, Resident, ResidentThreshold, AlertType, AlertCategory } from '../models';
import alertService from '../services/alertService';
import vitalService from '../services/vitalService';
import notificationService from '../services/notificationService';
import { broadcastAlert, broadcastVitalUpdate } from './socketHandlers';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface FallDetectionState {
  residentId: string;
  impactDetected: boolean;
  impactTime: number | null;
  inactivityStartTime: number | null;
  recentData: AccelerometerData[];
}

// Store fall detection state per resident
const fallDetectionStates: Map<string, FallDetectionState> = new Map();

export class AlertingEngine {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Process incoming vital data and check for anomalies
   */
  async processVitalData(vital: Vital): Promise<void> {
    try {
      // Get resident and thresholds
      const resident = await Resident.findByPk(vital.residentId, {
        include: [{ model: ResidentThreshold, as: 'threshold' }],
      });

      if (!resident) {
        logger.error('Resident not found for vital processing', {
          residentId: vital.residentId,
        });
        return;
      }

      const threshold = (resident as any).threshold;

      if (!threshold) {
        logger.warn('No thresholds found for resident', {
          residentId: vital.residentId,
        });
        return;
      }

      // Broadcast vital update via WebSocket
      broadcastVitalUpdate(this.io, resident.facilityId, vital.residentId, vital.toJSON());

      // Check each vital sign against thresholds
      await this.checkHeartRate(vital, resident, threshold);
      await this.checkSpO2(vital, resident, threshold);
      await this.checkRespirationRate(vital, resident, threshold);
      await this.checkStressLevel(vital, resident, threshold);

      // Check for fall detection if accelerometer data present
      if (vital.rawData && vital.rawData.accelerometer) {
        await this.checkFallDetection(vital, resident);
      }
    } catch (error) {
      logger.error('Error processing vital data', {
        error,
        vitalId: vital.id,
        residentId: vital.residentId,
      });
    }
  }

  /**
   * Check heart rate against thresholds
   */
  private async checkHeartRate(
    vital: Vital,
    resident: Resident,
    threshold: ResidentThreshold
  ): Promise<void> {
    if (vital.heartRate === null) return;

    if (!threshold.isHeartRateNormal(vital.heartRate)) {
      let severity: AlertType = AlertType.WARNING;
      let message = `Heart rate ${vital.heartRate} BPM is out of range`;

      // Determine severity
      if (
        vital.heartRate < threshold.heartRateMin - 10 ||
        vital.heartRate > threshold.heartRateMax + 20
      ) {
        severity = AlertType.CRITICAL;
        message = `CRITICAL: Heart rate ${vital.heartRate} BPM is severely out of range`;
      }

      await this.createAndBroadcastAlert({
        residentId: vital.residentId,
        facilityId: resident.facilityId,
        alertType: severity,
        category: AlertCategory.HEART_RATE,
        message: `${resident.fullName} - ${message} (Normal: ${threshold.heartRateMin}-${threshold.heartRateMax} BPM)`,
        vitalData: {
          heartRate: vital.heartRate,
          threshold: {
            min: threshold.heartRateMin,
            max: threshold.heartRateMax,
          },
          timestamp: vital.timestamp,
        },
      });
    }
  }

  /**
   * Check SpO2 against thresholds
   */
  private async checkSpO2(
    vital: Vital,
    resident: Resident,
    threshold: ResidentThreshold
  ): Promise<void> {
    if (vital.spo2 === null) return;

    if (!threshold.isSpO2Normal(vital.spo2)) {
      let severity: AlertType = vital.spo2 < 85 ? AlertType.CRITICAL : AlertType.WARNING;
      let message = `Blood oxygen ${vital.spo2}% is below threshold`;

      if (vital.spo2 < 85) {
        message = `CRITICAL: Blood oxygen ${vital.spo2}% is dangerously low`;
      }

      await this.createAndBroadcastAlert({
        residentId: vital.residentId,
        facilityId: resident.facilityId,
        alertType: severity,
        category: AlertCategory.SPO2,
        message: `${resident.fullName} - ${message} (Normal: ≥${threshold.spo2Min}%)`,
        vitalData: {
          spo2: vital.spo2,
          threshold: { min: threshold.spo2Min },
          timestamp: vital.timestamp,
        },
      });
    }
  }

  /**
   * Check respiration rate against thresholds
   */
  private async checkRespirationRate(
    vital: Vital,
    resident: Resident,
    threshold: ResidentThreshold
  ): Promise<void> {
    if (vital.respirationRate === null) return;

    if (!threshold.isRespirationRateNormal(vital.respirationRate)) {
      const alert = await this.createAndBroadcastAlert({
        residentId: vital.residentId,
        facilityId: resident.facilityId,
        alertType: AlertType.WARNING,
        category: AlertCategory.RESPIRATION_RATE,
        message: `${resident.fullName} - Respiration rate ${vital.respirationRate} breaths/min is abnormal (Normal: ${threshold.respirationRateMin}-${threshold.respirationRateMax})`,
        vitalData: {
          respirationRate: vital.respirationRate,
          threshold: {
            min: threshold.respirationRateMin,
            max: threshold.respirationRateMax,
          },
          timestamp: vital.timestamp,
        },
      });
    }
  }

  /**
   * Check stress level against thresholds
   */
  private async checkStressLevel(
    vital: Vital,
    resident: Resident,
    threshold: ResidentThreshold
  ): Promise<void> {
    if (vital.stressLevel === null) return;

    if (!threshold.isStressLevelNormal(vital.stressLevel)) {
      await this.createAndBroadcastAlert({
        residentId: vital.residentId,
        facilityId: resident.facilityId,
        alertType: AlertType.WARNING,
        category: AlertCategory.STRESS_LEVEL,
        message: `${resident.fullName} - Stress level ${vital.stressLevel} is elevated (Threshold: ≤${threshold.stressLevelMax})`,
        vitalData: {
          stressLevel: vital.stressLevel,
          threshold: { max: threshold.stressLevelMax },
          timestamp: vital.timestamp,
        },
      });
    }
  }

  /**
   * Fall detection algorithm
   */
  private async checkFallDetection(vital: Vital, resident: Resident): Promise<void> {
    try {
      const accelerometerData: AccelerometerData = vital.rawData.accelerometer;

      if (!accelerometerData || !accelerometerData.x || !accelerometerData.y || !accelerometerData.z) {
        return;
      }

      // Get or create fall detection state for this resident
      let state = fallDetectionStates.get(vital.residentId);
      if (!state) {
        state = {
          residentId: vital.residentId,
          impactDetected: false,
          impactTime: null,
          inactivityStartTime: null,
          recentData: [],
        };
        fallDetectionStates.set(vital.residentId, state);
      }

      // Add current data to recent data buffer (keep last 30 seconds)
      state.recentData.push(accelerometerData);
      const thirtySecondsAgo = Date.now() - 30000;
      state.recentData = state.recentData.filter(d => d.timestamp > thirtySecondsAgo);

      // Calculate magnitude of acceleration
      const magnitude = Math.sqrt(
        accelerometerData.x ** 2 +
        accelerometerData.y ** 2 +
        accelerometerData.z ** 2
      );

      const now = Date.now();

      // Detect impact (sudden high acceleration)
      if (magnitude > config.fallDetection.impactThreshold) {
        if (!state.impactDetected) {
          state.impactDetected = true;
          state.impactTime = now;
          logger.warn('Potential fall impact detected', {
            residentId: vital.residentId,
            magnitude,
            threshold: config.fallDetection.impactThreshold,
          });
        }
      }

      // Check for prolonged inactivity after impact
      if (state.impactDetected && state.impactTime) {
        const timeSinceImpact = now - state.impactTime;

        // Check if still inactive
        if (magnitude < config.fallDetection.inactivityThreshold) {
          if (!state.inactivityStartTime) {
            state.inactivityStartTime = now;
          }

          const inactivityDuration = now - state.inactivityStartTime;

          // If inactive for configured duration after impact, trigger fall alert
          if (inactivityDuration >= config.fallDetection.inactivityDuration) {
            await this.createAndBroadcastAlert({
              residentId: vital.residentId,
              facilityId: resident.facilityId,
              alertType: AlertType.CRITICAL,
              category: AlertCategory.FALL_DETECTED,
              message: `FALL DETECTED: ${resident.fullName} - Possible fall with prolonged inactivity. Immediate assistance required!`,
              vitalData: {
                impactMagnitude: magnitude,
                impactTime: state.impactTime,
                inactivityDuration,
                location: vital.rawData.location || 'Unknown',
                timestamp: vital.timestamp,
              },
            });

            // Reset state after alert
            state.impactDetected = false;
            state.impactTime = null;
            state.inactivityStartTime = null;
          }
        } else {
          // Movement detected, reset inactivity
          state.inactivityStartTime = null;

          // If movement within reasonable time, it might not be a fall
          if (timeSinceImpact < 5000) {
            state.impactDetected = false;
            state.impactTime = null;
          }
        }
      }

      // Clear old state if no impact detected for a while
      if (state.impactDetected && state.impactTime && now - state.impactTime > 60000) {
        state.impactDetected = false;
        state.impactTime = null;
        state.inactivityStartTime = null;
      }

    } catch (error) {
      logger.error('Error in fall detection', {
        error,
        residentId: vital.residentId,
      });
    }
  }

  /**
   * Create alert and broadcast to facility
   */
  private async createAndBroadcastAlert(data: {
    residentId: string;
    facilityId: string;
    alertType: AlertType;
    category: AlertCategory;
    message: string;
    vitalData: any;
  }): Promise<void> {
    try {
      // Create alert in database
      const alert = await alertService.createAlert(
        {
          residentId: data.residentId,
          alertType: data.alertType,
          category: data.category,
          message: data.message,
          vitalData: data.vitalData,
        },
        data.facilityId
      );

      // Broadcast alert via WebSocket
      broadcastAlert(this.io, data.facilityId, alert.toJSON());

      // Send push notifications and SMS for critical alerts
      if (data.alertType === AlertType.CRITICAL) {
        await notificationService.notifyStaffOfAlert(
          data.facilityId,
          data.category,
          data.message,
          {
            alertType: data.alertType,
            alertId: alert.id,
            residentId: data.residentId,
          }
        );
      }
    } catch (error) {
      logger.error('Error creating and broadcasting alert', {
        error,
        data,
      });
    }
  }
}

export default AlertingEngine;
