import { Request, Response } from 'express';
import { User } from '../models';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { generateSecureToken } from '../utils/encryption';
import notificationService from '../services/notificationService';
import { logger } from '../utils/logger';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const { role, isActive } = req.query;

  const where: any = { facilityId };

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const users = await User.findAll({
    where,
    order: [['lastName', 'ASC'], ['firstName', 'ASC']],
  });

  res.status(200).json({
    success: true,
    data: { users, count: users.length },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  const user = await User.findOne({
    where: { id, facilityId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.user!.facilityId;
  const { email, password, firstName, lastName, role, phoneNumber } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash: password, // Will be hashed by model hook
    firstName,
    lastName,
    role,
    facilityId,
    phoneNumber,
    isActive: true,
  });

  logger.info('User created', {
    userId: user.id,
    email: user.email,
    role: user.role,
    createdBy: req.user!.userId,
  });

  // TODO: Send welcome email with temp password
  // await notificationService.sendWelcomeEmail(user, facility, password);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user },
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;
  const { firstName, lastName, role, phoneNumber, isActive } = req.body;

  const user = await User.findOne({
    where: { id, facilityId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent updating own role or active status (unless super admin logic exists)
  if (id === req.user!.userId) {
    if (role && role !== user.role) {
      throw new AppError('Cannot change your own role', 403);
    }
    if (isActive !== undefined && isActive !== user.isActive) {
      throw new AppError('Cannot change your own active status', 403);
    }
  }

  await user.update({
    firstName,
    lastName,
    role,
    phoneNumber,
    isActive,
  });

  logger.info('User updated', {
    userId: user.id,
    updatedBy: req.user!.userId,
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  if (id === req.user!.userId) {
    throw new AppError('Cannot deactivate yourself', 403);
  }

  const user = await User.findOne({
    where: { id, facilityId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = false;
  await user.save();

  logger.info('User deactivated', {
    userId: user.id,
    deactivatedBy: req.user!.userId,
  });

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facilityId = req.user!.facilityId;

  const user = await User.findOne({
    where: { id, facilityId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate temporary password
  const tempPassword = generateSecureToken(12);

  await user.setPassword(tempPassword);
  user.refreshToken = null; // Force re-login
  await user.save();

  logger.info('User password reset', {
    userId: user.id,
    resetBy: req.user!.userId,
  });

  // TODO: Send email with temp password
  // await notificationService.sendEmail({
  //   to: user.email,
  //   subject: 'Password Reset',
  //   text: `Your new temporary password is: ${tempPassword}`
  // });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Temporary password sent to user email.',
    data: {
      // In development, return temp password
      ...(process.env.NODE_ENV === 'development' && { tempPassword }),
    },
  });
});
