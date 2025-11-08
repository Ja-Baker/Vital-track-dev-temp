import Facility from './Facility';
import User from './User';
import Resident from './Resident';
import ResidentThreshold from './ResidentThreshold';
import Vital from './Vital';
import Alert from './Alert';

// Define associations

// Facility associations
Facility.hasMany(User, {
  foreignKey: 'facilityId',
  as: 'users',
});

Facility.hasMany(Resident, {
  foreignKey: 'facilityId',
  as: 'residents',
});

// User associations
User.belongsTo(Facility, {
  foreignKey: 'facilityId',
  as: 'facility',
});

// Resident associations
Resident.belongsTo(Facility, {
  foreignKey: 'facilityId',
  as: 'facility',
});

Resident.hasOne(ResidentThreshold, {
  foreignKey: 'residentId',
  as: 'threshold',
  onDelete: 'CASCADE',
});

Resident.hasMany(Vital, {
  foreignKey: 'residentId',
  as: 'vitals',
  onDelete: 'CASCADE',
});

Resident.hasMany(Alert, {
  foreignKey: 'residentId',
  as: 'alerts',
  onDelete: 'CASCADE',
});

// ResidentThreshold associations
ResidentThreshold.belongsTo(Resident, {
  foreignKey: 'residentId',
  as: 'resident',
});

// Vital associations
Vital.belongsTo(Resident, {
  foreignKey: 'residentId',
  as: 'resident',
});

// Alert associations
Alert.belongsTo(Resident, {
  foreignKey: 'residentId',
  as: 'resident',
});

Alert.belongsTo(User, {
  foreignKey: 'acknowledgedBy',
  as: 'acknowledger',
});

Alert.belongsTo(User, {
  foreignKey: 'resolvedBy',
  as: 'resolver',
});

export {
  Facility,
  User,
  Resident,
  ResidentThreshold,
  Vital,
  Alert,
};
