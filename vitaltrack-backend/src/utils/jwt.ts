import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  facilityId: string;
  type: 'access' | 'refresh' | 'reset';
}

export const generateAccessToken = (payload: Omit<JWTPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiration }
  );
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiration }
  );
};

export const generateResetPasswordToken = (payload: Omit<JWTPayload, 'type' | 'role' | 'facilityId'>): string => {
  return jwt.sign(
    { ...payload, type: 'reset' },
    config.jwt.secret,
    { expiresIn: config.jwt.resetPasswordExpiration }
  );
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
