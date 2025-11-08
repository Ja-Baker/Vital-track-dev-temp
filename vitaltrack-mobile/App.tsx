import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Redux store
import { store, persistor } from './src/store/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { initializeAuth } from './src/store/slices/authSlice';

// Theme
import { lightTheme } from './src/theme/theme';

// WebSocket service
import { websocketService } from './src/services/websocket';
import { addVitalUpdate } from './src/store/slices/vitalsSlice';
import { addAlert, updateAlert } from './src/store/slices/alertsSlice';
import { updateResidentVitalStatus } from './src/store/slices/residentsSlice';

// Navigation (placeholders - will be created later)
import RootNavigator from './src/navigation/RootNavigator';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Require cycle:',
]);

// App content component (has access to Redux)
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // Initialize auth on app start
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Handle vital updates
    const handleVitalUpdate = (data: { residentId: string; data: any }) => {
      console.log('[App] Vital update received:', data.residentId);
      dispatch(addVitalUpdate(data.data));
      dispatch(
        updateResidentVitalStatus({
          residentId: data.residentId,
          lastVitalTimestamp: data.data.timestamp,
          latestVital: data.data,
        })
      );
    };

    // Handle alert created
    const handleAlertCreated = (data: { alert: any }) => {
      console.log('[App] Alert created:', data.alert.id);
      dispatch(addAlert(data.alert));
    };

    // Handle alert updated
    const handleAlertUpdated = (data: { alert: any }) => {
      console.log('[App] Alert updated:', data.alert.id);
      dispatch(updateAlert(data.alert));
    };

    // Handle errors
    const handleError = (data: { message: string }) => {
      console.error('[App] WebSocket error:', data.message);
    };

    // Register event listeners
    websocketService.on('vital_update', handleVitalUpdate);
    websocketService.on('alert_created', handleAlertCreated);
    websocketService.on('alert_updated', handleAlertUpdated);
    websocketService.on('error', handleError);

    // Cleanup
    return () => {
      websocketService.off('vital_update', handleVitalUpdate);
      websocketService.off('alert_created', handleAlertCreated);
      websocketService.off('alert_updated', handleAlertUpdated);
      websocketService.off('error', handleError);
    };
  }, [isAuthenticated, dispatch]);

  // Show loading while initializing
  if (!isInitialized) {
    return null; // TODO: Add proper splash screen
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PaperProvider theme={lightTheme}>
            <SafeAreaProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
              <AppContent />
            </SafeAreaProvider>
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default App;
