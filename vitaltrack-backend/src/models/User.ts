import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/database';
import Facility from './Facility';

export enum UserRole {
  ADMIN = 'admin',
  NURSE = 'nurse',
  CAREGIVER = 'caregiver',
}

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  facilityId: string;
  phoneNumber: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  fcmToken: string | null;
  fcmTokenUpdatedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'phoneNumber' | 'lastLoginAt' | 'refreshToken' | 'resetPasswordToken' | 'resetPasswordExpires' | 'fcmToken' | 'fcmTokenUpdatedAt' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: UserRole;
  public facilityId!: string;
  public phoneNumber!: string | null;
  public isActive!: boolean;
  public lastLoginAt!: Date | null;
  public refreshToken!: string | null;
  public resetPasswordToken!: string | null;
  public resetPasswordExpires!: Date | null;
  public fcmToken!: string | null;
  public fcmTokenUpdatedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(password, salt);
  }

  public toJSON(): any {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.refreshToken;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    return values;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
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
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
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
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone_number',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token',
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reset_password_token',
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_expires',
    },
    fcmToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'fcm_token',
    },
    fcmTokenUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'fcm_token_updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.passwordHash && !user.passwordHash.startsWith('$2b$')) {
          await user.setPassword(user.passwordHash);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('passwordHash') && !user.passwordHash.startsWith('$2b$')) {
          await user.setPassword(user.passwordHash);
        }
      },
    },
  }
);

export default User;
