import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom color palette
export const colors = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  secondaryLight: '#C8E6C9',
  error: '#F44336',
  errorDark: '#D32F2F',
  errorLight: '#FFCDD2',
  warning: '#FF9800',
  warningDark: '#F57C00',
  warningLight: '#FFE0B2',
  info: '#2196F3',
  success: '#4CAF50',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',

  // Status colors
  critical: '#F44336',
  normalRange: '#4CAF50',
  outOfRange: '#FF9800',

  // Vital sign colors
  heartRate: '#E91E63',
  spo2: '#2196F3',
  respirationRate: '#9C27B0',
  stressLevel: '#FF9800',
  steps: '#4CAF50',
  calories: '#FF5722',
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    error: colors.error,
    errorContainer: colors.errorLight,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
  },
  custom: colors,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondaryLight,
    secondaryContainer: colors.secondaryDark,
    error: colors.errorLight,
    errorContainer: colors.errorDark,
  },
  custom: colors,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    textTransform: 'uppercase' as const,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export type Theme = typeof lightTheme;
