/**
 * Shared utility functions
 */

/**
 * Calculate time elapsed since a given date
 * @param {string|Date} date - The date to compare against
 * @returns {string} Human-readable time difference
 */
export function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return new Date(date).toLocaleDateString();
}

/**
 * Format a timestamp for chart display
 * @param {string|Date} value - The timestamp to format
 * @returns {string} Formatted time string
 */
export function formatChartTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a timestamp for tooltip display
 * @param {string|Date} value - The timestamp to format
 * @returns {string} Formatted datetime string
 */
export function formatTooltipTime(value) {
  return new Date(value).toLocaleString();
}

/**
 * Get initials from first and last name
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
}

/**
 * Determine vital status based on thresholds
 * @param {Object} vitals - The vital signs object
 * @returns {string} Status: 'normal', 'warning', or 'critical'
 */
export function determineVitalStatus(vitals) {
  if (!vitals) return 'normal';

  const { heartRate, spo2, temperature } = vitals;

  // Critical conditions
  if (spo2 && spo2 < 90) return 'critical';

  // Warning conditions
  if (heartRate && (heartRate < 50 || heartRate > 120)) return 'warning';
  if (spo2 && spo2 < 94) return 'warning';
  if (temperature && temperature > 99.5) return 'warning';

  return 'normal';
}

/**
 * Format blood pressure for display
 * @param {Object} bloodPressure - Object with systolic and diastolic values
 * @returns {string} Formatted blood pressure or '--'
 */
export function formatBloodPressure(bloodPressure) {
  if (!bloodPressure?.systolic || !bloodPressure?.diastolic) return '--';
  return `${bloodPressure.systolic}/${bloodPressure.diastolic}`;
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validated pagination object
 */
export function validatePagination(page, limit) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));

  return { page: validPage, limit: validLimit };
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safely parse JSON with fallback
 * @param {string} json - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed value or fallback
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
