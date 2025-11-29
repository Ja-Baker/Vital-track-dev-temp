import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

interface NetworkState {
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingActions: PendingAction[];
  isSyncing: boolean;
}

const initialState: NetworkState = {
  isOnline: true,
  lastSyncedAt: null,
  pendingActions: [],
  isSyncing: false,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addPendingAction: (state, action: PayloadAction<Omit<PendingAction, 'id' | 'timestamp'>>) => {
      state.pendingActions.push({
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      });
    },
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter((a) => a.id !== action.payload);
    },
    clearPendingActions: (state) => {
      state.pendingActions = [];
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSynced: (state, action: PayloadAction<string>) => {
      state.lastSyncedAt = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  clearPendingActions,
  setSyncing,
  setLastSynced,
} = networkSlice.actions;

export default networkSlice.reducer;
