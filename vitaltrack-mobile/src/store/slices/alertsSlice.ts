import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { Alert, AlertStats, AlertStatus, AlertType, ApiResponse } from '../../types';

// State interface
interface AlertsState {
  alerts: Alert[];
  stats: AlertStats | null;
  selectedAlert: Alert | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  filters: {
    status?: AlertStatus;
    type?: AlertType;
    residentId?: string;
  };
}

// Initial state
const initialState: AlertsState = {
  alerts: [],
  stats: null,
  selectedAlert: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
};

// Async thunks

// Fetch all alerts
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAll',
  async (
    params: {
      status?: AlertStatus;
      type?: AlertType;
      residentId?: string;
      limit?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.residentId) queryParams.append('residentId', params.residentId);
      if (params.limit) queryParams.append('limit', String(params.limit));

      const response = await apiService.get<
        ApiResponse<{ alerts: Alert[]; count: number }>
      >(`/alerts?${queryParams.toString()}`);

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch alerts');
      }

      return response.data.alerts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alerts');
    }
  }
);

// Fetch alerts for a specific resident
export const fetchResidentAlerts = createAsyncThunk(
  'alerts/fetchResident',
  async (
    { residentId, status }: { residentId: string; status?: AlertStatus },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);

      const response = await apiService.get<
        ApiResponse<{ alerts: Alert[]; count: number }>
      >(`/alerts/resident/${residentId}?${queryParams.toString()}`);

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch resident alerts');
      }

      return response.data.alerts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch resident alerts');
    }
  }
);

// Fetch single alert
export const fetchAlert = createAsyncThunk(
  'alerts/fetchOne',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<ApiResponse<{ alert: Alert }>>(
        `/alerts/${alertId}`
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch alert');
      }

      return response.data.alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alert');
    }
  }
);

// Fetch alert statistics
export const fetchAlertStats = createAsyncThunk(
  'alerts/fetchStats',
  async (residentId?: string, { rejectWithValue }) => {
    try {
      const url = residentId
        ? `/alerts/stats?residentId=${residentId}`
        : '/alerts/stats';

      const response = await apiService.get<ApiResponse<{ stats: AlertStats }>>(url);

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch alert stats');
      }

      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alert stats');
    }
  }
);

// Acknowledge alert
export const acknowledgeAlert = createAsyncThunk(
  'alerts/acknowledge',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<{ alert: Alert }>>(
        `/alerts/${alertId}/acknowledge`
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to acknowledge alert');
      }

      return response.data.alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to acknowledge alert');
    }
  }
);

// Resolve alert
export const resolveAlert = createAsyncThunk(
  'alerts/resolve',
  async (
    { alertId, notes }: { alertId: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post<ApiResponse<{ alert: Alert }>>(
        `/alerts/${alertId}/resolve`,
        { resolutionNotes: notes }
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to resolve alert');
      }

      return response.data.alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve alert');
    }
  }
);

// Escalate alert
export const escalateAlert = createAsyncThunk(
  'alerts/escalate',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<{ alert: Alert }>>(
        `/alerts/${alertId}/escalate`
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to escalate alert');
      }

      return response.data.alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to escalate alert');
    }
  }
);

// Slice
const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedAlert: (state) => {
      state.selectedAlert = null;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        status?: AlertStatus;
        type?: AlertType;
        residentId?: string;
      }>
    ) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      // Add new alert to the beginning of the list
      state.alerts.unshift(action.payload);

      // Update stats
      if (state.stats) {
        state.stats.total += 1;
        state.stats[action.payload.alertType] += 1;
        state.stats[action.payload.status] += 1;
      }

      state.lastUpdated = Date.now();
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      const index = state.alerts.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        // Update stats based on status change
        if (state.stats && state.alerts[index].status !== action.payload.status) {
          state.stats[state.alerts[index].status] -= 1;
          state.stats[action.payload.status] += 1;
        }

        state.alerts[index] = action.payload;
      }

      if (state.selectedAlert?.id === action.payload.id) {
        state.selectedAlert = action.payload;
      }

      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    // Fetch all alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch resident alerts
    builder
      .addCase(fetchResidentAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResidentAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchResidentAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single alert
    builder
      .addCase(fetchAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedAlert = action.payload;
        state.error = null;
      })
      .addCase(fetchAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch alert stats
    builder
      .addCase(fetchAlertStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAlertStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchAlertStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Acknowledge alert
    builder
      .addCase(acknowledgeAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        if (state.selectedAlert?.id === action.payload.id) {
          state.selectedAlert = action.payload;
        }
        state.error = null;
      })
      .addCase(acknowledgeAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resolve alert
    builder
      .addCase(resolveAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        if (state.selectedAlert?.id === action.payload.id) {
          state.selectedAlert = action.payload;
        }
        state.error = null;
      })
      .addCase(resolveAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Escalate alert
    builder
      .addCase(escalateAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(escalateAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        if (state.selectedAlert?.id === action.payload.id) {
          state.selectedAlert = action.payload;
        }
        state.error = null;
      })
      .addCase(escalateAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSelectedAlert,
  setFilters,
  clearFilters,
  addAlert,
  updateAlert,
} = alertsSlice.actions;

export default alertsSlice.reducer;
