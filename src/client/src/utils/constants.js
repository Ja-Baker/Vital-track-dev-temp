/**
 * Shared constants used throughout the application
 */

export const API_BASE = '/api';

// Status configuration for badges and indicators
export const STATUS_CONFIG = {
  normal: { bg: 'var(--success)', text: 'white', label: 'Normal' },
  warning: { bg: 'var(--warning)', text: '#1F2937', label: 'Warning' },
  critical: { bg: 'var(--critical)', text: 'white', label: 'Critical' },
  offline: { bg: 'var(--gray)', text: 'white', label: 'Offline' },
  pending: { bg: 'var(--warning)', text: '#1F2937', label: 'Pending' },
  acknowledged: { bg: 'var(--info)', text: 'white', label: 'Acknowledged' },
  resolved: { bg: 'var(--success)', text: 'white', label: 'Resolved' }
};

// Color mappings for status types
export const STATUS_COLORS = {
  normal: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
  info: 'var(--info)',
  offline: 'var(--gray)'
};

// Alert type configuration
export const ALERT_TYPE_CONFIG = {
  critical: { color: 'var(--critical)', icon: '🚨' },
  warning: { color: 'var(--warning)', icon: '⚠️' },
  info: { color: 'var(--info)', icon: 'ℹ️' }
};

// Trend icons for vital indicators
export const TREND_ICONS = {
  up: '↑',
  down: '↓',
  stable: '→'
};

// Loading spinner sizes
export const SPINNER_SIZES = {
  sm: '24px',
  md: '40px',
  lg: '60px'
};

// Navigation items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'residents', label: 'Residents', icon: '👥' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

// Resident detail tabs
export const RESIDENT_TABS = [
  { id: 'vitals', label: 'Vitals', icon: '❤️' },
  { id: 'activity', label: 'Activity', icon: '🚶' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
  { id: 'log', label: 'Care Log', icon: '📝' }
];

// Resident status filter options
export const RESIDENT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical', icon: '🔴' },
  { value: 'warning', label: 'Warning', icon: '🟡' },
  { value: 'normal', label: 'Normal', icon: '🟢' }
];

// Alert status filter options
export const ALERT_FILTERS = [
  { value: 'pending', label: 'Active' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' }
];

// Vital sign thresholds for status determination
export const VITAL_THRESHOLDS = {
  heartRate: { low: 50, high: 120, criticalLow: 40, criticalHigh: 150 },
  spo2: { warning: 94, critical: 90 },
  temperature: { warning: 99.5, critical: 101.0 }
};

// Vital sign ranges for display
export const VITAL_RANGES = {
  heartRate: '60-100',
  spo2: '>95%',
  bloodPressure: '120/80',
  temperature: '97.8-99.1'
};
