/**
 * Input validation utilities for API endpoints
 */

/**
 * Validate and sanitize pagination parameters
 * @param {string|number} page - Page number
 * @param {string|number} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} Validated pagination object
 */
function validatePagination(page, limit, maxLimit = 100) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 50));

  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit
  };
}

/**
 * Validate that a value is a positive integer
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} { valid: boolean, value: number|null, error: string|null }
 */
function validatePositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: null, error: null };
  }

  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed < 1) {
    return {
      valid: false,
      value: null,
      error: `${fieldName} must be a positive integer`
    };
  }

  return { valid: true, value: parsed, error: null };
}

/**
 * Validate UUID format
 * @param {string} value - Value to validate
 * @returns {boolean} Whether the value is a valid UUID
 */
function isValidUUID(value) {
  if (!value || typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input - trim and limit length
 * @param {string} value - Value to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string|null} Sanitized string or null
 */
function sanitizeString(value, maxLength = 255) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  return value.trim().substring(0, maxLength);
}

/**
 * Validate enum value
 * @param {string} value - Value to validate
 * @param {string[]} allowedValues - Array of allowed values
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateEnum(value, allowedValues, fieldName) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, error: null };
  }

  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate hours parameter for history queries
 * @param {*} hours - Hours value
 * @returns {number} Validated hours (1-168, default 24)
 */
function validateHours(hours) {
  const parsed = parseInt(hours);
  if (isNaN(parsed) || parsed < 1) return 24;
  return Math.min(168, parsed); // Max 1 week
}

/**
 * Create validation error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Error response object
 */
function validationError(message, code = 'VALIDATION_ERROR') {
  return {
    error: {
      code,
      message
    }
  };
}

module.exports = {
  validatePagination,
  validatePositiveInt,
  isValidUUID,
  isValidEmail,
  validatePassword,
  sanitizeString,
  validateEnum,
  validateHours,
  validationError
};
