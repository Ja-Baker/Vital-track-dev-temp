import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Resident from './Resident';
import { config } from '../config/environment';

interface ResidentThresholdAttributes {
  id: string;
  residentId: string;
  heartRateMin: number;
  heartRateMax: number;
  spo2Min: number;
  respirationRateMin: number;
  respirationRateMax: number;
  stressLevelMax: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResidentThresholdCreationAttributes extends Optional<ResidentThresholdAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ResidentThreshold extends Model<ResidentThresholdAttributes, ResidentThresholdCreationAttributes> implements ResidentThresholdAttributes {
  public id!: string;
  public residentId!: string;
  public heartRateMin!: number;
  public heartRateMax!: number;
  public spo2Min!: number;
  public respirationRateMin!: number;
  public respirationRateMax!: number;
  public stressLevelMax!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to check if vital is within threshold
  public isHeartRateNormal(heartRate: number): boolean {
    return heartRate >= this.heartRateMin && heartRate <= this.heartRateMax;
  }

  public isSpO2Normal(spo2: number): boolean {
    return spo2 >= this.spo2Min;
  }

  public isRespirationRateNormal(respirationRate: number): boolean {
    return respirationRate >= this.respirationRateMin && respirationRate <= this.respirationRateMax;
  }

  public isStressLevelNormal(stressLevel: number): boolean {
    return stressLevel <= this.stressLevelMax;
  }
}

ResidentThreshold.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    residentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'resident_id',
      references: {
        model: Resident,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    heartRateMin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: config.alertThresholds.heartRateMin,
      field: 'heart_rate_min',
      validate: {
        min: 30,
        max: 200,
      },
    },
    heartRateMax: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: config.alertThresholds.heartRateMax,
      field: 'heart_rate_max',
      validate: {
        min: 30,
        max: 200,
      },
    },
    spo2Min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: config.alertThresholds.spo2Min,
      field: 'spo2_min',
      validate: {
        min: 70,
        max: 100,
      },
    },
    respirationRateMin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: config.alertThresholds.respirationRateMin,
      field: 'respiration_rate_min',
      validate: {
        min: 5,
        max: 50,
      },
    },
    respirationRateMax: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: config.alertThresholds.respirationRateMax,
      field: 'respiration_rate_max',
      validate: {
        min: 5,
        max: 50,
      },
    },
    stressLevelMax: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: config.alertThresholds.stressLevelMax,
      field: 'stress_level_max',
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    tableName: 'resident_thresholds',
    timestamps: true,
    underscored: true,
    validate: {
      heartRateMinLessThanMax() {
        if (this.heartRateMin >= this.heartRateMax) {
          throw new Error('Heart rate min must be less than heart rate max');
        }
      },
      respirationRateMinLessThanMax() {
        if (this.respirationRateMin >= this.respirationRateMax) {
          throw new Error('Respiration rate min must be less than respiration rate max');
        }
      },
    },
  }
);

export default ResidentThreshold;
