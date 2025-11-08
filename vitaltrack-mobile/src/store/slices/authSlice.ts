import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';
import {
  User,
  Facility,
  LoginCredentials,
  LoginResponse,
  ApiResponse,
} from '../../types';

// State interface
interface AuthState {
  user: User | null;
  facility: Facility | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  facility: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Async thunks

// Initialize auth (check stored tokens)
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const [accessToken, refreshToken, user, facility] = await Promise.all([
        apiService.storage.getAccessToken(),
        apiService.storage.getRefreshToken(),
        apiService.storage.getUser(),
        apiService.storage.getFacility(),
      ]);

      if (accessToken && refreshToken && user && facility) {
        // Verify token is still valid by fetching current user
        try {
          const response = await apiService.get<ApiResponse<{ user: User }>>(
            '/auth/me'
          );

          if (response.success && response.data) {
            // Connect to WebSocket
            await websocketService.connect();

            return {
              user: response.data.user,
              facility,
              accessToken,
              refreshToken,
            };
          }
        } catch (error) {
          // Token is invalid, clear storage
          await apiService.storage.clearAll();
          return rejectWithValue('Session expired');
        }
      }

      return rejectWithValue('No stored session');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize auth');
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        credentials
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Login failed');
      }

      const { user, facility, accessToken, refreshToken } = response.data;

      // Store tokens and user data
      await Promise.all([
        apiService.storage.setAccessToken(accessToken),
        apiService.storage.setRefreshToken(refreshToken),
        apiService.storage.setUser(user),
        apiService.storage.setFacility(facility),
      ]);

      // Connect to WebSocket
      await websocketService.connect();

      return { user, facility, accessToken, refreshToken };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Call logout API (doesn't matter if it fails)
      try {
        await apiService.post('/auth/logout');
      } catch (error) {
        console.log('Logout API call failed, continuing...');
      }

      // Disconnect WebSocket
      websocketService.disconnect();

      // Clear storage
      await apiService.storage.clearAll();

      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post<ApiResponse>(
        '/auth/change-password',
        { currentPassword, newPassword }
      );

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to change password');
      }

      return response.message || 'Password changed successfully';
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (
    { email, facilityCode }: { email: string; facilityCode: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post<ApiResponse>(
        '/auth/forgot-password',
        { email, facilityCode }
      );

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to send reset email');
      }

      return response.message || 'Reset email sent successfully';
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send reset email');
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, newPassword }: { token: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post<ApiResponse>(
        '/auth/reset-password',
        { token, newPassword }
      );

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to reset password');
      }

      return response.message || 'Password reset successfully';
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset password');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.facility = action.payload.facility;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.facility = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.facility = action.payload.facility;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        return { ...initialState, isInitialized: true };
      })
      .addCase(logout.rejected, (state) => {
        return { ...initialState, isInitialized: true };
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Forgot password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
