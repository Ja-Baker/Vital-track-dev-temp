import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FacilityAttributes {
  id: string;
  name: string;
  facilityCode: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FacilityCreationAttributes extends Optional<FacilityAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Facility extends Model<FacilityAttributes, FacilityCreationAttributes> implements FacilityAttributes {
  public id!: string;
  public name!: string;
  public facilityCode!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public zipCode!: string;
  public phoneNumber!: string;
  public email!: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Facility.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    facilityCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'facility_code',
    },
    address: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'zip_code',
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'phone_number',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'facilities',
    timestamps: true,
    underscored: true,
  }
);

export default Facility;
