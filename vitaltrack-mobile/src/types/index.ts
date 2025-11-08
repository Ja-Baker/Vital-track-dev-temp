// Core type definitions for VitalTrack mobile app

export enum UserRole {
  ADMIN = 'admin',
  NURSE = 'nurse',
  CAREGIVER = 'caregiver',
}

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
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  facilityId: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Facility {
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
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  roomNumber: string;
  facilityId: string;
  garminDeviceId?: string;
  photoUrl?: string;
  medicalNotes?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isActive: boolean;
  fullName?: string;
  age?: number;
}

export interface ResidentThreshold {
  id: string;
  residentId: string;
  heartRateMin: number;
  heartRateMax: number;
  spo2Min: number;
  respirationRateMin: number;
  respirationRateMax: number;
  stressLevelMax: number;
}

export interface Vital {
  id: string;
  residentId: string;
  timestamp: string;
  heartRate?: number;
  spo2?: number;
  respirationRate?: number;
  stressLevel?: number;
  steps?: number;
  calories?: number;
  source: string;
  rawData?: Record<string, any>;
}

export interface Alert {
  id: string;
  residentId: string;
  alertType: AlertType;
  category: AlertCategory;
  message: string;
  vitalData?: Record<string, any>;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  escalatedAt?: string;
  createdAt: string;
  resident?: Resident;
  acknowledger?: User;
  resolver?: User;
}

export interface VitalStats {
  count: number;
  avgHeartRate?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  avgSpO2?: number;
  minSpO2?: number;
  maxSpO2?: number;
  avgRespirationRate?: number;
  minRespirationRate?: number;
  maxRespirationRate?: number;
  avgStressLevel?: number;
  minStressLevel?: number;
  maxStressLevel?: number;
  totalSteps?: number;
  totalCalories?: number;
}

export interface VitalTrend {
  timestamp: string;
  avgHeartRate?: number;
  avgSpO2?: number;
  avgRespirationRate?: number;
  avgStressLevel?: number;
  totalSteps?: number;
  totalCalories?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  facilityCode: string;
}

export interface LoginResponse {
  user: User;
  facility: Facility;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ResidentWithStatus extends Resident {
  latestVital?: Vital;
  activeAlerts?: number;
  lastVitalTimestamp?: string;
}

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  active: number;
  acknowledged: number;
  resolved: number;
}
