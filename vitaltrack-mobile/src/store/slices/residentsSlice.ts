import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import {
  Resident,
  ResidentWithStatus,
  ResidentThreshold,
  ApiResponse,
} from '../../types';

// State interface
interface ResidentsState {
  residents: ResidentWithStatus[];
  selectedResident: Resident | null;
  selectedResidentThreshold: ResidentThreshold | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: ResidentsState = {
  residents: [],
  selectedResident: null,
  selectedResidentThreshold: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
};

// Async thunks

// Fetch all residents with status
export const fetchResidents = createAsyncThunk(
  'residents/fetchAll',
  async (params: { search?: string; isActive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined)
        queryParams.append('isActive', String(params.isActive));

      const response = await apiService.get<
        ApiResponse<{ residents: ResidentWithStatus[] }>
      >(`/residents/with-status?${queryParams.toString()}`);

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch residents');
      }

      return response.data.residents;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch residents');
    }
  }
);

// Fetch single resident
export const fetchResident = createAsyncThunk(
  'residents/fetchOne',
  async (residentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<ApiResponse<{ resident: Resident }>>(
        `/residents/${residentId}`
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch resident');
      }

      return response.data.resident;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch resident');
    }
  }
);

// Fetch resident with vitals
export const fetchResidentWithVitals = createAsyncThunk(
  'residents/fetchWithVitals',
  async (
    { residentId, hours = 24 }: { residentId: string; hours?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.get<
        ApiResponse<{ resident: Resident; vitals: any[] }>
      >(`/residents/${residentId}/with-vitals?hours=${hours}`);

      if (!response.success || !response.data) {
        return rejectWithValue(
          response.message || 'Failed to fetch resident with vitals'
        );
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch resident with vitals'
      );
    }
  }
);

// Create resident
export const createResident = createAsyncThunk(
  'residents/create',
  async (residentData: Partial<Resident>, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<{ resident: Resident }>>(
        '/residents',
        residentData
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to create resident');
      }

      return response.data.resident;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create resident');
    }
  }
);

// Update resident
export const updateResident = createAsyncThunk(
  'residents/update',
  async (
    { residentId, data }: { residentId: string; data: Partial<Resident> },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.put<ApiResponse<{ resident: Resident }>>(
        `/residents/${residentId}`,
        data
      );

      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to update resident');
      }

      return response.data.resident;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update resident');
    }
  }
);

// Delete resident
export const deleteResident = createAsyncThunk(
  'residents/delete',
  async (residentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.delete<ApiResponse>(
        `/residents/${residentId}`
      );

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to delete resident');
      }

      return residentId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete resident');
    }
  }
);

// Update resident thresholds
export const updateResidentThresholds = createAsyncThunk(
  'residents/updateThresholds',
  async (
    {
      residentId,
      thresholds,
    }: { residentId: string; thresholds: Partial<ResidentThreshold> },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.put<
        ApiResponse<{ threshold: ResidentThreshold }>
      >(`/residents/${residentId}/thresholds`, thresholds);

      if (!response.success || !response.data) {
        return rejectWithValue(
          response.message || 'Failed to update thresholds'
        );
      }

      return { residentId, threshold: response.data.threshold };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update thresholds');
    }
  }
);

// Slice
const residentsSlice = createSlice({
  name: 'residents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedResident: (state) => {
      state.selectedResident = null;
      state.selectedResidentThreshold = null;
    },
    updateResidentInList: (state, action: PayloadAction<ResidentWithStatus>) => {
      const index = state.residents.findIndex(
        (r) => r.id === action.payload.id
      );
      if (index !== -1) {
        state.residents[index] = action.payload;
      }
    },
    updateResidentVitalStatus: (
      state,
      action: PayloadAction<{
        residentId: string;
        lastVitalTimestamp: string;
        latestVital: any;
      }>
    ) => {
      const resident = state.residents.find(
        (r) => r.id === action.payload.residentId
      );
      if (resident) {
        resident.lastVitalTimestamp = action.payload.lastVitalTimestamp;
        resident.latestVital = action.payload.latestVital;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch all residents
    builder
      .addCase(fetchResidents.pending, (state, action) => {
        // Check if this is a refresh (has meta.arg)
        if (action.meta.arg && Object.keys(action.meta.arg).length === 0) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchResidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.residents = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchResidents.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      });

    // Fetch single resident
    builder
      .addCase(fetchResident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResident.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedResident = action.payload;
        state.error = null;
      })
      .addCase(fetchResident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch resident with vitals
    builder
      .addCase(fetchResidentWithVitals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResidentWithVitals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedResident = action.payload.resident;
        state.error = null;
      })
      .addCase(fetchResidentWithVitals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create resident
    builder
      .addCase(createResident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createResident.fulfilled, (state, action) => {
        state.isLoading = false;
        state.residents.unshift(action.payload as ResidentWithStatus);
        state.error = null;
      })
      .addCase(createResident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update resident
    builder
      .addCase(updateResident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateResident.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.residents.findIndex(
          (r) => r.id === action.payload.id
        );
        if (index !== -1) {
          state.residents[index] = {
            ...state.residents[index],
            ...action.payload,
          };
        }
        if (state.selectedResident?.id === action.payload.id) {
          state.selectedResident = action.payload;
        }
        state.error = null;
      })
      .addCase(updateResident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete resident
    builder
      .addCase(deleteResident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteResident.fulfilled, (state, action) => {
        state.isLoading = false;
        state.residents = state.residents.filter((r) => r.id !== action.payload);
        if (state.selectedResident?.id === action.payload) {
          state.selectedResident = null;
        }
        state.error = null;
      })
      .addCase(deleteResident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update thresholds
    builder
      .addCase(updateResidentThresholds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateResidentThresholds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedResidentThreshold = action.payload.threshold;
        state.error = null;
      })
      .addCase(updateResidentThresholds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSelectedResident,
  updateResidentInList,
  updateResidentVitalStatus,
} = residentsSlice.actions;

export default residentsSlice.reducer;
