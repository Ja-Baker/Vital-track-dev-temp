/**
 * API service for making authenticated HTTP requests
 */
import { API_BASE } from '../utils/constants';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.baseUrl = API_BASE;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || 'Request failed');
        error.code = data.error?.code || 'UNKNOWN_ERROR';
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timed out');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }

      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const api = new ApiService();

// Export class for testing
export default ApiService;
