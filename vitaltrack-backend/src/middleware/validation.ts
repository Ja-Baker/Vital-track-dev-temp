import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
      return;
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    facilityCode: Joi.string().min(3).max(50).required(),
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'nurse', 'caregiver').required(),
    facilityId: Joi.string().uuid().required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  }),

  // Resident
  createResident: Joi.object({
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    dateOfBirth: Joi.date().max('now').required(),
    roomNumber: Joi.string().max(20).optional(),
    facilityId: Joi.string().uuid().required(),
    garminDeviceId: Joi.string().max(100).optional(),
    photoUrl: Joi.string().uri().max(500).optional(),
    medicalNotes: Joi.string().max(5000).optional(),
    emergencyContactName: Joi.string().max(200).optional(),
    emergencyContactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  }),

  updateResident: Joi.object({
    firstName: Joi.string().min(2).max(100).optional(),
    lastName: Joi.string().min(2).max(100).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    roomNumber: Joi.string().max(20).optional().allow(null),
    garminDeviceId: Joi.string().max(100).optional().allow(null),
    photoUrl: Joi.string().uri().max(500).optional().allow(null),
    medicalNotes: Joi.string().max(5000).optional().allow(null),
    emergencyContactName: Joi.string().max(200).optional().allow(null),
    emergencyContactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(null),
    isActive: Joi.boolean().optional(),
  }),

  // Resident Thresholds
  updateThresholds: Joi.object({
    heartRateMin: Joi.number().integer().min(30).max(200).optional(),
    heartRateMax: Joi.number().integer().min(30).max(200).optional(),
    spo2Min: Joi.number().integer().min(70).max(100).optional(),
    respirationRateMin: Joi.number().integer().min(5).max(50).optional(),
    respirationRateMax: Joi.number().integer().min(5).max(50).optional(),
    stressLevelMax: Joi.number().integer().min(0).max(100).optional(),
  }),

  // Vitals
  recordVital: Joi.object({
    residentId: Joi.string().uuid().required(),
    timestamp: Joi.date().optional(),
    heartRate: Joi.number().integer().min(20).max(300).optional(),
    spo2: Joi.number().integer().min(0).max(100).optional(),
    respirationRate: Joi.number().integer().min(0).max(100).optional(),
    stressLevel: Joi.number().integer().min(0).max(100).optional(),
    steps: Joi.number().integer().min(0).optional(),
    calories: Joi.number().integer().min(0).optional(),
    source: Joi.string().max(50).optional(),
    rawData: Joi.object().optional(),
  }),

  // Alerts
  acknowledgeAlert: Joi.object({
    userId: Joi.string().uuid().required(),
  }),

  resolveAlert: Joi.object({
    userId: Joi.string().uuid().required(),
    resolutionNotes: Joi.string().max(1000).optional(),
  }),

  // User Management
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'nurse', 'caregiver').required(),
    facilityId: Joi.string().uuid().required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(100).optional(),
    lastName: Joi.string().min(2).max(100).optional(),
    role: Joi.string().valid('admin', 'nurse', 'caregiver').optional(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(null),
    isActive: Joi.boolean().optional(),
  }),
};
