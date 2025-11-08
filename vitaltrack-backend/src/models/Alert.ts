import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Resident from './Resident';
import User from './User';

export enum AlertType {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum AlertCategory {
  HEART_RATE = 'heart_rate',
  SPO2 = 'spo2',
  RESPIRATION_RATE = 'respiration_rate',
  STRESS_LEVEL = 'stress_level',
  FALL_DETECTED = 'fall_detected',
  DEVICE_DISCONNECTED = 'device_disconnected',
  LOW_BATTERY = 'low_battery',
  IRREGULAR_RHYTHM = 'irregular_rhythm',
}

interface AlertAttributes {
  id: string;
  residentId: string;
  alertType: AlertType;
  category: AlertCategory;
  message: string;
  vitalData: any | null;
  status: AlertStatus;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  escalatedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AlertCreationAttributes extends Optional<AlertAttributes, 'id' | 'vitalData' | 'acknowledgedBy' | 'acknowledgedAt' | 'resolvedBy' | 'resolvedAt' | 'resolutionNotes' | 'escalatedAt' | 'createdAt' | 'updatedAt'> {}

class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: string;
  public residentId!: string;
  public alertType!: AlertType;
  public category!: AlertCategory;
  public message!: string;
  public vitalData!: any | null;
  public status!: AlertStatus;
  public acknowledgedBy!: string | null;
  public acknowledgedAt!: Date | null;
  public resolvedBy!: string | null;
  public resolvedAt!: Date | null;
  public resolutionNotes!: string | null;
  public escalatedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper methods
  public isActive(): boolean {
    return this.status === AlertStatus.ACTIVE;
  }

  public isCritical(): boolean {
    return this.alertType === AlertType.CRITICAL;
  }

  public getResponseTime(): number | null {
    if (!this.acknowledgedAt) return null;
    return this.acknowledgedAt.getTime() - this.createdAt.getTime();
  }

  public getResolutionTime(): number | null {
    if (!this.resolvedAt) return null;
    return this.resolvedAt.getTime() - this.createdAt.getTime();
  }

  public async acknowledge(userId: string): Promise<void> {
    this.status = AlertStatus.ACKNOWLEDGED;
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
    await this.save();
  }

  public async resolve(userId: string, notes?: string): Promise<void> {
    this.status = AlertStatus.RESOLVED;
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    if (notes) {
      this.resolutionNotes = notes;
    }
    await this.save();
  }

  public async escalate(): Promise<void> {
    this.status = AlertStatus.ESCALATED;
    this.escalatedAt = new Date();
    await this.save();
  }
}

Alert.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    residentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'resident_id',
      references: {
        model: Resident,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    alertType: {
      type: DataTypes.ENUM(...Object.values(AlertType)),
      allowNull: false,
      field: 'alert_type',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    vitalData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'vital_data',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AlertStatus)),
      allowNull: false,
      defaultValue: AlertStatus.ACTIVE,
    },
    acknowledgedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'acknowledged_by',
      references: {
        model: User,
        key: 'id',
      },
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acknowledged_at',
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resolved_by',
      references: {
        model: User,
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'resolution_notes',
    },
    escalatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'escalated_at',
    },
  },
  {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['resident_id', 'status', 'created_at'],
        name: 'idx_alerts_resident_status',
      },
      {
        fields: ['status', 'created_at'],
        name: 'idx_alerts_status_created',
      },
      {
        fields: ['alert_type', 'created_at'],
        name: 'idx_alerts_type_created',
      },
    ],
  }
);

export default Alert;
