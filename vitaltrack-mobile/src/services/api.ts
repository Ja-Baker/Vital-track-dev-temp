import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.vitaltrack.com/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@vitaltrack_access_token',
  REFRESH_TOKEN: '@vitaltrack_refresh_token',
  USER: '@vitaltrack_user',
  FACILITY: '@vitaltrack_facility',
};

// Types
interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        // Redirect to login (handled by Redux)
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        if (response.data.success && response.data.data.accessToken) {
          const newAccessToken = response.data.data.accessToken;
          await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

          // Update original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.FACILITY,
        ]);

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      const message = (error.response.data as any)?.message || 'An error occurred';

      if (error.response.status >= 500) {
        Alert.alert('Server Error', 'Please try again later');
      } else if (error.response.status === 403) {
        Alert.alert('Permission Denied', 'You do not have access to this resource');
      }

      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      Alert.alert('Network Error', 'Please check your internet connection');
      return Promise.reject(new Error('Network error - please check your connection'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// API Service
export const apiService = {
  // Storage helpers
  storage: {
    setAccessToken: (token: string) =>
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
    setRefreshToken: (token: string) =>
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
    setUser: (user: any) =>
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
    setFacility: (facility: any) =>
      AsyncStorage.setItem(STORAGE_KEYS.FACILITY, JSON.stringify(facility)),
    getAccessToken: () =>
      AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    getRefreshToken: () =>
      AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    getUser: async () => {
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    },
    getFacility: async () => {
      const facility = await AsyncStorage.getItem(STORAGE_KEYS.FACILITY);
      return facility ? JSON.parse(facility) : null;
    },
    clearAll: () =>
      AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.FACILITY,
      ]),
  },

  // Generic request methods
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),

  // Health check
  healthCheck: () =>
    apiClient.get('/health').then((res) => res.data),
};

export default apiClient;
export { STORAGE_KEYS };
