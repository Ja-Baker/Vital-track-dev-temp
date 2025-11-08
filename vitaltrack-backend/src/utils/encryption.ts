import crypto from 'crypto';
import { config } from '../config/environment';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Encrypt data using AES-256-GCM for HIPAA compliance
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const key = crypto.pbkdf2Sync(config.encryption.key, salt, 100000, 32, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

/**
 * Decrypt data encrypted with encrypt()
 */
export const decrypt = (encryptedData: string): string => {
  const buffer = Buffer.from(encryptedData, 'base64');

  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.slice(ENCRYPTED_POSITION);

  const key = crypto.pbkdf2Sync(config.encryption.key, salt, 100000, 32, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
};

/**
 * Hash sensitive data (one-way, for comparison only)
 */
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
