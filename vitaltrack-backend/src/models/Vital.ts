import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Resident from './Resident';

interface VitalAttributes {
  id: string;
  residentId: string;
  timestamp: Date;
  heartRate: number | null;
  spo2: number | null;
  respirationRate: number | null;
  stressLevel: number | null;
  steps: number | null;
  calories: number | null;
  source: string;
  rawData: any | null;
  createdAt?: Date;
}

interface VitalCreationAttributes extends Optional<VitalAttributes, 'id' | 'heartRate' | 'spo2' | 'respirationRate' | 'stressLevel' | 'steps' | 'calories' | 'rawData' | 'createdAt'> {}

class Vital extends Model<VitalAttributes, VitalCreationAttributes> implements VitalAttributes {
  public id!: string;
  public residentId!: string;
  public timestamp!: Date;
  public heartRate!: number | null;
  public spo2!: number | null;
  public respirationRate!: number | null;
  public stressLevel!: number | null;
  public steps!: number | null;
  public calories!: number | null;
  public source!: string;
  public rawData!: any | null;

  public readonly createdAt!: Date;

  // Helper method to check if any vital is present
  public hasAnyVital(): boolean {
    return !!(
      this.heartRate ||
      this.spo2 ||
      this.respirationRate ||
      this.stressLevel ||
      this.steps ||
      this.calories
    );
  }

  // Helper method to get vital summary
  public getSummary(): string {
    const vitals: string[] = [];
    if (this.heartRate) vitals.push(`HR: ${this.heartRate} bpm`);
    if (this.spo2) vitals.push(`SpO2: ${this.spo2}%`);
    if (this.respirationRate) vitals.push(`RR: ${this.respirationRate} brpm`);
    if (this.stressLevel) vitals.push(`Stress: ${this.stressLevel}`);
    return vitals.join(', ') || 'No vitals';
  }
}

Vital.init(
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
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    heartRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'heart_rate',
      validate: {
        min: 20,
        max: 300,
      },
    },
    spo2: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    respirationRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'respiration_rate',
      validate: {
        min: 0,
        max: 100,
      },
    },
    stressLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'stress_level',
      validate: {
        min: 0,
        max: 100,
      },
    },
    steps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'garmin_companion_sdk',
    },
    rawData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'raw_data',
    },
  },
  {
    sequelize,
    tableName: 'vitals',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Vitals are immutable, no need for updatedAt
    indexes: [
      {
        fields: ['resident_id', 'timestamp'],
        name: 'idx_vitals_resident_timestamp',
      },
      {
        fields: ['timestamp'],
        name: 'idx_vitals_timestamp',
      },
      {
        fields: ['resident_id', 'created_at'],
        name: 'idx_vitals_resident_created',
      },
    ],
  }
);

export default Vital;
