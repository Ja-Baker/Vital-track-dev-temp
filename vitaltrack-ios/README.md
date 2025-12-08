# VitalTrack iOS App

iOS native application for VitalTrack senior health monitoring platform.

## Quick Start

### React Native Setup (Recommended)

```bash
# Initialize project
npx react-native init VitalTrack --template react-native-template-typescript

# Install core dependencies
npm install axios socket.io-client @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated

# Install UI/Charts
npm install victory-native react-native-svg react-native-maps

# Install storage
npm install @react-native-async-storage/async-storage react-native-keychain

# Install push notifications
npm install @react-native-firebase/app @react-native-firebase/messaging

# Install state management
npm install @tanstack/react-query zustand react-hook-form zod date-fns

# iOS setup
cd ios && pod install && cd ..

# Run
npx react-native run-ios
```

### Capacitor Setup (Quick Wrap)

```bash
# From web project
npm install @capacitor/core @capacitor/cli
npx cap init VitalTrack com.vitaltrack.app
npx cap add ios
npx cap sync
npx cap open ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── VitalCard.tsx
│   ├── ResidentCard.tsx
│   ├── AlertBanner.tsx
│   └── StatusBadge.tsx
├── screens/             # App screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ResidentDetailScreen.tsx
│   └── AlertsScreen.tsx
├── services/            # API and socket
│   ├── api.ts
│   ├── socket.ts
│   └── notifications.ts
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useVitals.ts
│   └── useAlerts.ts
├── stores/              # State management
│   └── authStore.ts
├── types/               # TypeScript types
│   └── index.ts
└── navigation/          # Navigation config
    └── AppNavigator.tsx
```

## Environment Setup

Create `.env` file:

```env
API_URL=https://your-backend.railway.app
SOCKET_URL=wss://your-backend.railway.app
```

## Documentation

See `/docs` folder for complete specifications:

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [API_SPEC.md](../docs/API_SPEC.md) - API endpoints
- [FEATURES.md](../docs/FEATURES.md) - Feature specifications
- [UI_SPEC.md](../docs/UI_SPEC.md) - Design system
- [SECURITY.md](../docs/SECURITY.md) - HIPAA compliance
- [DEVELOPMENT_PHASES.md](../docs/DEVELOPMENT_PHASES.md) - Build phases

## Key Features to Implement

### Phase 1 (MVP)
- [ ] User authentication (login/logout)
- [ ] Resident list with status indicators
- [ ] Real-time vital updates via Socket.io
- [ ] Vital history charts
- [ ] Alert list and acknowledgment
- [ ] Push notifications

### Phase 2
- [ ] GPS location tracking
- [ ] Geofencing alerts
- [ ] Fall detection events
- [ ] Care logging
- [ ] SOS workflow

### Phase 3
- [ ] Analytics dashboard
- [ ] Export reports
- [ ] Family app (simplified view)
- [ ] Predictive analytics

## API Integration

```typescript
// api.ts
import axios from 'axios';
import { getToken } from './storage';

const api = axios.create({
  baseURL: process.env.API_URL + '/api',
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string, facilityCode: string) =>
    api.post('/auth/login', { email, password, facilityCode }),
  logout: () => api.post('/auth/logout'),
};

export const residentsApi = {
  getAll: () => api.get('/residents'),
  getById: (id: string) => api.get(`/residents/${id}`),
  getVitals: (id: string, from?: string, to?: string) =>
    api.get(`/residents/${id}/vitals`, { params: { from, to } }),
};

export const alertsApi = {
  getAll: (status?: string) => api.get('/alerts', { params: { status } }),
  acknowledge: (id: string) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id: string, outcome: string, notes: string) =>
    api.post(`/alerts/${id}/resolve`, { outcome, notes }),
};
```

## Socket.io Integration

```typescript
// socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  joinFacility(facilityId: string) {
    this.socket?.emit('join-facility', facilityId);
  }

  onVitalUpdate(callback: (data: VitalUpdate) => void) {
    this.socket?.on('vital-update', callback);
  }

  onNewAlert(callback: (alert: Alert) => void) {
    this.socket?.on('new-alert', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();
```

## Push Notifications

```typescript
// notifications.ts
import messaging from '@react-native-firebase/messaging';

export const setupPushNotifications = async () => {
  // Request permission
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

  if (enabled) {
    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Send token to backend
    await api.post('/users/fcm-token', { token });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      // Show in-app notification
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });
  }
};
```

## Demo Credentials

```
Admin:     admin@demo.com     / Demo123! / DEMO001
Nurse:     nurse@demo.com     / Demo123! / DEMO001
Caregiver: caregiver@demo.com / Demo123! / DEMO001
```
