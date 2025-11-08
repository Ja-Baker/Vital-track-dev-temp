import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '../store/hooks';
import { RootStackParamList } from './types';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import screens
import ResidentDetailScreen from '../screens/ResidentDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          {/* Modal/Detail screens */}
          <Stack.Screen
            name="ResidentDetail"
            component={ResidentDetailScreen}
            options={{
              headerShown: true,
              title: 'Resident Details',
              headerBackTitle: 'Back',
            }}
          />
          {/* TODO: Add AlertDetail, EditResident, EditThresholds, Settings, ChangePassword */}
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
