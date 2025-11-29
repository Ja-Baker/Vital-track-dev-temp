import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import residentsReducer from './slices/residentsSlice';
import vitalsReducer from './slices/vitalsSlice';
import alertsReducer from './slices/alertsSlice';
import themeReducer from './slices/themeSlice';
import networkReducer from './slices/networkSlice';

// Redux persist config
const persistConfig = {
  key: 'root',
  version: 2,
  storage: AsyncStorage,
  whitelist: ['auth', 'theme', 'residents', 'network'], // Persist for offline support
  blacklist: ['vitals', 'alerts'], // Don't persist these (refetch on app start)
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  residents: residentsReducer,
  vitals: vitalsReducer,
  alerts: alertsReducer,
  theme: themeReducer,
  network: networkReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks (to be used instead of plain `useDispatch` and `useSelector`)
export default store;
