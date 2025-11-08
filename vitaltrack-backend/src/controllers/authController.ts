import { Request, Response } from 'express';
import authService from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, facilityCode } = req.body;

  const result = await authService.login({ email, password, facilityCode });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  await authService.logout(userId);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const result = await authService.resetPassword(token, newPassword);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;

  const result = await authService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!.userRecord;

  res.status(200).json({
    success: true,
    data: {
      user: user?.toJSON(),
    },
  });
});
