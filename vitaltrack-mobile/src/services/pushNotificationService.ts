import { Platform, PermissionsAndroid, Alert } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

const FCM_TOKEN_KEY = '@vitaltrack_fcm_token';

interface NotificationData {
  alertId?: string;
  residentId?: string;
  alertType?: string;
  [key: string]: string | undefined;
}

class PushNotificationService {
  private messageUnsubscribe: (() => void) | null = null;
  private notificationOpenedUnsubscribe: (() => void) | null = null;

  async initialize(): Promise<void> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('[PushNotification] Permission denied');
        return;
      }

      // Get FCM token and register with backend
      await this.registerToken();

      // Set up message handlers
      this.setupMessageHandlers();

      console.log('[PushNotification] Service initialized');
    } catch (error) {
      console.error('[PushNotification] Initialization failed:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('[PushNotification] Authorization status:', authStatus);
      return enabled;
    } catch (error) {
      console.error('[PushNotification] Permission request failed:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('[PushNotification] FCM Token:', token.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('[PushNotification] Failed to get token:', error);
      return null;
    }
  }

  async registerToken(): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.warn('[PushNotification] No token to register');
        return;
      }

      // Check if token has changed
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken === token) {
        console.log('[PushNotification] Token unchanged, skipping registration');
        return;
      }

      // Register with backend
      await apiService.post('/users/device-token', { fcmToken: token });

      // Store token locally
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

      console.log('[PushNotification] Token registered with backend');
    } catch (error) {
      console.error('[PushNotification] Token registration failed:', error);
    }
  }

  async unregisterToken(): Promise<void> {
    try {
      // Unregister from backend
      await apiService.delete('/users/device-token');

      // Remove stored token
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);

      console.log('[PushNotification] Token unregistered');
    } catch (error) {
      console.error('[PushNotification] Token unregistration failed:', error);
    }
  }

  private setupMessageHandlers(): void {
    // Handle foreground messages
    this.messageUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('[PushNotification] Foreground message:', remoteMessage);
      this.showLocalNotification(remoteMessage);
    });

    // Handle notification opened app from background
    this.notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[PushNotification] Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage.data as NotificationData);
    });

    // Handle notification opened app from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[PushNotification] Initial notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage.data as NotificationData);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('[PushNotification] Token refreshed');
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      await apiService.post('/users/device-token', { fcmToken: token });
    });
  }

  private showLocalNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { notification, data } = remoteMessage;
    if (!notification) return;

    // Show alert for foreground notifications
    Alert.alert(
      notification.title || 'VitalTrack Alert',
      notification.body || '',
      [
        {
          text: 'Dismiss',
          style: 'cancel',
        },
        {
          text: 'View',
          onPress: () => this.handleNotificationPress(data as NotificationData),
        },
      ],
      { cancelable: true }
    );
  }

  private handleNotificationPress(data: NotificationData | undefined): void {
    if (!data) return;

    // Navigation will be handled by the app based on the notification data
    // This could emit an event or use a navigation ref
    console.log('[PushNotification] Handle notification press:', data);

    // You can use React Navigation's navigation ref or event emitter here
    // to navigate to the appropriate screen based on the notification type
  }

  cleanup(): void {
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
    if (this.notificationOpenedUnsubscribe) {
      this.notificationOpenedUnsubscribe();
      this.notificationOpenedUnsubscribe = null;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
