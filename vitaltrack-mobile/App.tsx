import React, { useEffect } from 'react';
import { StatusBar, LogBox, useColorScheme, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Redux store
import { store, persistor } from './src/store/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { initializeAuth } from './src/store/slices/authSlice';
import { updateSystemTheme } from './src/store/slices/themeSlice';
import { setOnlineStatus } from './src/store/slices/networkSlice';

// Theme
import { lightTheme, darkTheme } from './src/theme/theme';

// WebSocket service
import { websocketService } from './src/services/websocket';
import { addVitalUpdate } from './src/store/slices/vitalsSlice';
import { addAlert, updateAlert } from './src/store/slices/alertsSlice';
import { updateResidentVitalStatus } from './src/store/slices/residentsSlice';

// Push notification service
import { pushNotificationService } from './src/services/pushNotificationService';

// Navigation (placeholders - will be created later)
import RootNavigator from './src/navigation/RootNavigator';

// Hooks and components
import useNetworkStatus from './src/hooks/useNetworkStatus';
import OfflineBanner from './src/components/common/OfflineBanner';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Require cycle:',
]);

// App content component (has access to Redux)
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  const { isDark, mode } = useAppSelector((state) => state.theme);
  const { isOnline, pendingActions } = useAppSelector((state) => state.network);
  const systemColorScheme = useColorScheme();
  const networkStatus = useNetworkStatus();

  // Initialize auth on app start
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Update network status in Redux
  useEffect(() => {
    dispatch(setOnlineStatus(networkStatus.isConnected && networkStatus.isInternetReachable !== false));
  }, [networkStatus.isConnected, networkStatus.isInternetReachable, dispatch]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode === 'system') {
      dispatch(updateSystemTheme());
    }
  }, [systemColorScheme, mode, dispatch]);

  // Initialize push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      pushNotificationService.initialize();
    }

    return () => {
      pushNotificationService.cleanup();
    };
  }, [isAuthenticated]);

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

  // Select theme based on Redux state
  const paperTheme = isDark ? darkTheme : lightTheme;
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121212' : '#FFFFFF'}
      />
      <View style={{ flex: 1 }}>
        <OfflineBanner
          isVisible={!isOnline}
          pendingActionsCount={pendingActions.length}
        />
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </View>
    </PaperProvider>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default App;
