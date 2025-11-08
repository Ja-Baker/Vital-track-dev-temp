import { format, formatDistance, formatRelative, isToday, isYesterday } from 'date-fns';

// Date formatters
export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
  try {
    return format(new Date(date), formatStr);
  } catch {
    return 'Invalid date';
  }
};

export const formatTime = (date: string | Date, formatStr: string = 'h:mm a'): string => {
  try {
    return format(new Date(date), formatStr);
  } catch {
    return 'Invalid time';
  }
};

export const formatDateTime = (
  date: string | Date,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string => {
  try {
    return format(new Date(date), formatStr);
  } catch {
    return 'Invalid date';
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = new Date(date);

    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'h:mm a')}`;
    }

    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'h:mm a')}`;
    }

    return formatRelative(dateObj, new Date());
  } catch {
    return 'Invalid date';
  }
};

export const formatTimeAgo = (date: string | Date): string => {
  try {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

// Vital sign formatters
export const formatHeartRate = (value?: number): string => {
  if (value === undefined || value === null) return '--';
  return `${Math.round(value)} bpm`;
};

export const formatSpO2 = (value?: number): string => {
  if (value === undefined || value === null) return '--';
  return `${Math.round(value)}%`;
};

export const formatRespirationRate = (value?: number): string => {
  if (value === undefined || value === null) return '--';
  return `${Math.round(value)} rpm`;
};

export const formatStressLevel = (value?: number): string => {
  if (value === undefined || value === null) return '--';
  return Math.round(value).toString();
};

export const formatSteps = (value?: number): string => {
  if (value === undefined || value === null) return '--';
  return value.toLocaleString();
};

export const formatCalories = (value?: number): string => {
  if (value === undefined || value === null) return '--';
  return Math.round(value).toLocaleString();
};

// Number formatters
export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Name formatters
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

export const formatInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

// Age calculator
export const calculateAge = (dateOfBirth: string | Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// Phone number formatter
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

// Alert type formatter
export const formatAlertType = (type: string): string => {
  switch (type) {
    case 'critical':
      return 'Critical';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
    default:
      return type;
  }
};

// Alert status formatter
export const formatAlertStatus = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'acknowledged':
      return 'Acknowledged';
    case 'resolved':
      return 'Resolved';
    case 'escalated':
      return 'Escalated';
    default:
      return status;
  }
};

// Alert category formatter
export const formatAlertCategory = (category: string): string => {
  const formatted = category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return formatted;
};

// Role formatter
export const formatRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'nurse':
      return 'Nurse';
    case 'caregiver':
      return 'Caregiver';
    default:
      return role;
  }
};
