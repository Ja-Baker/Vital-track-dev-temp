import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { Vital, VitalStats, VitalTrend, ApiResponse } from '../../types';

// State interface
interface VitalsState {
  vitals: Vital[];
  latestVital: Vital | null;
  stats: VitalStats | null;
  trends: VitalTrend[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: VitalsState = {
  vitals: [],
  latestVital: null,
  stats: null,
  trends: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks

// Fetch latest vital for a resident
export const fetchLatestVital = createAsyncThunk(
  'vitals/fetchLatest',
  async (residentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<ApiResponse<{ vital: Vital | null }>>(
        `/vitals/resident/${residentId}/latest`
      );

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch latest vital');
      }

      return { residentId, vital: response.data?.vital || null };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch latest vital');
    }
  }
);

// Fetch vital history for a resident
export const fetchVitalHistory = createAsyncThunk(
  'vitals/fetchHistory',
  async (
    {
      residentId,
      startDate,
      endDate,
      limit = 100,
    }: {
      residentId: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate.toISOString());
      if (endDate) queryParams.append('endDate', endDate.toISOString());
      queryParams.append('limit', String(limit));

      const response = await apiService.get<
        ApiResponse<{ vitals: Vital[]; count: number }>
      >(`/vitals/resident/${residentId}/history?${queryParams.toString()}`);

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch vital history');
      }

      return response.data.vitals;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vital history');
    }
  }
);

// Fetch vital statistics
export const fetchVitalStats = createAsyncThunk(
  'vitals/fetchStats',
  async (
    { residentId, hours = 24 }: { residentId: string; hours?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.get<ApiResponse<{ stats: VitalStats }>>(
        `/vitals/resident/${residentId}/stats?hours=${hours}`
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch vital stats');
      }

      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vital stats');
    }
  }
);

// Fetch vital trends
export const fetchVitalTrends = createAsyncThunk(
  'vitals/fetchTrends',
  async (
    {
      residentId,
      intervalMinutes = 60,
      hours = 24,
    }: {
      residentId: string;
      intervalMinutes?: number;
      hours?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.get<
        ApiResponse<{ trends: VitalTrend[]; count: number }>
      >(
        `/vitals/resident/${residentId}/trends?intervalMinutes=${intervalMinutes}&hours=${hours}`
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch vital trends');
      }

      return response.data.trends;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vital trends');
    }
  }
);

// Record vital (admin/testing only)
export const recordVital = createAsyncThunk(
  'vitals/record',
  async (vitalData: Partial<Vital>, { rejectWithValue }) => {
    try {
      const response = await apiService.post<
        ApiResponse<{ vital: Vital; analysis: any }>
      >('/vitals', vitalData);

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to record vital');
      }

      return response.data.vital;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record vital');
    }
  }
);

// Slice
const vitalsSlice = createSlice({
  name: 'vitals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVitals: (state) => {
      state.vitals = [];
      state.latestVital = null;
      state.stats = null;
      state.trends = [];
    },
    addVitalUpdate: (state, action: PayloadAction<Vital>) => {
      // Add new vital to the beginning of the list
      state.vitals.unshift(action.payload);

      // Keep only the latest 100 vitals
      if (state.vitals.length > 100) {
        state.vitals = state.vitals.slice(0, 100);
      }

      // Update latest vital
      state.latestVital = action.payload;
      state.lastUpdated = Date.now();
    },
    updateLatestVital: (state, action: PayloadAction<Vital>) => {
      state.latestVital = action.payload;
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    // Fetch latest vital
    builder
      .addCase(fetchLatestVital.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLatestVital.fulfilled, (state, action) => {
        state.isLoading = false;
        state.latestVital = action.payload.vital;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchLatestVital.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch vital history
    builder
      .addCase(fetchVitalHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVitalHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vitals = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchVitalHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch vital stats
    builder
      .addCase(fetchVitalStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVitalStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchVitalStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch vital trends
    builder
      .addCase(fetchVitalTrends.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVitalTrends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trends = action.payload;
        state.error = null;
      })
      .addCase(fetchVitalTrends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Record vital
    builder
      .addCase(recordVital.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(recordVital.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vitals.unshift(action.payload);
        state.latestVital = action.payload;
        state.error = null;
      })
      .addCase(recordVital.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearVitals, addVitalUpdate, updateLatestVital } =
  vitalsSlice.actions;

export default vitalsSlice.reducer;
