import { User, Facility } from '../models';
import { generateAccessToken, generateRefreshToken, generateResetPasswordToken, verifyToken } from '../utils/jwt';
import { generateSecureToken } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface LoginCredentials {
  email: string;
  password: string;
  facilityCode: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    facilityId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password, facilityCode } = credentials;

    // Find facility by code
    const facility = await Facility.findOne({
      where: { facilityCode, isActive: true },
    });

    if (!facility) {
      throw new AppError('Invalid facility code', 401);
    }

    // Find user by email and facility
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        facilityId: facility.id,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to user record
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        facilityId: user.facilityId,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }

      // Find user and verify refresh token
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        facilityId: user.facilityId,
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Token refresh failed', 401);
    }
  }

  async logout(userId: string): Promise<void> {
    const user = await User.findByPk(userId);

    if (user) {
      user.refreshToken = null;
      await user.save();

      logger.info('User logged out', {
        userId: user.id,
        email: user.email,
      });
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });

    if (!user) {
      // Don't reveal whether user exists
      return { message: 'If an account exists with this email, a password reset link will be sent.' };
    }

    // Generate reset token
    const resetToken = generateSecureToken(32);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info('Password reset requested', {
      userId: user.id,
      email: user.email,
    });

    return { message: 'If an account exists with this email, a password reset link will be sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        isActive: true,
      },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    await user.setPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    logger.info('Password reset successful', {
      userId: user.id,
      email: user.email,
    });

    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    await user.setPassword(newPassword);
    user.refreshToken = null; // Invalidate current session
    await user.save();

    logger.info('Password changed', {
      userId: user.id,
      email: user.email,
    });

    return { message: 'Password changed successfully' };
  }
}

export default new AuthService();
