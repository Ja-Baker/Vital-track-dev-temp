// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push('At least 8 characters');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('At least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('At least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('At least one number');
  } else {
    score += 1;
  }

  if (!/[@$!%*?&#]/.test(password)) {
    feedback.push('At least one special character (@$!%*?&#)');
  } else {
    score += 1;
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return { strength, score, feedback };
};

// Phone number validation
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
};

// Facility code validation
export const isValidFacilityCode = (code: string): boolean => {
  // Facility code should be alphanumeric and 4-10 characters
  const codeRegex = /^[A-Za-z0-9]{4,10}$/;
  return codeRegex.test(code);
};

// Vital sign validators
export const isValidHeartRate = (value: number): boolean => {
  return value >= 20 && value <= 250;
};

export const isValidSpO2 = (value: number): boolean => {
  return value >= 50 && value <= 100;
};

export const isValidRespirationRate = (value: number): boolean => {
  return value >= 5 && value <= 60;
};

export const isValidStressLevel = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

// Room number validation
export const isValidRoomNumber = (room: string): boolean => {
  return room.trim().length > 0 && room.trim().length <= 10;
};

// Name validation
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// Date validation
export const isValidDateOfBirth = (date: string | Date): boolean => {
  try {
    const dob = new Date(date);
    const today = new Date();
    const minDate = new Date(1900, 0, 1);

    return dob >= minDate && dob < today;
  } catch {
    return false;
  }
};

// Threshold validators
export const isValidThreshold = (min: number, max: number): boolean => {
  return min < max && min >= 0;
};

// Required field validator
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Min length validator
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

// Max length validator
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

// Range validator
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};
