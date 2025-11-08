import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Facility from './Facility';

interface ResidentAttributes {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  roomNumber: string | null;
  facilityId: string;
  garminDeviceId: string | null;
  photoUrl: string | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResidentCreationAttributes extends Optional<ResidentAttributes, 'id' | 'roomNumber' | 'garminDeviceId' | 'photoUrl' | 'medicalNotes' | 'emergencyContactName' | 'emergencyContactPhone' | 'createdAt' | 'updatedAt'> {}

class Resident extends Model<ResidentAttributes, ResidentCreationAttributes> implements ResidentAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth!: Date;
  public roomNumber!: string | null;
  public facilityId!: string;
  public garminDeviceId!: string | null;
  public photoUrl!: string | null;
  public medicalNotes!: string | null;
  public emergencyContactName!: string | null;
  public emergencyContactPhone!: string | null;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Computed properties
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  public toJSON(): any {
    const values = { ...this.get() };
    // Add computed properties
    values.fullName = this.fullName;
    values.age = this.age;
    return values;
  }
}

Resident.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_of_birth',
    },
    roomNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'room_number',
    },
    facilityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'facility_id',
      references: {
        model: Facility,
        key: 'id',
      },
    },
    garminDeviceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: 'garmin_device_id',
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'photo_url',
    },
    medicalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'medical_notes',
    },
    emergencyContactName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'emergency_contact_name',
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_phone',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'residents',
    timestamps: true,
    underscored: true,
  }
);

export default Resident;
