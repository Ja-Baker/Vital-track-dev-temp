import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Alerts: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ResidentDetail: { residentId: string };
  AlertDetail: { alertId: string };
  EditResident: { residentId?: string };
  EditThresholds: { residentId: string };
  Settings: undefined;
  ChangePassword: undefined;
};

// Screen props types
export type AuthScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type RootScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
