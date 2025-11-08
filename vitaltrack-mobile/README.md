# 📱 VitalTrack Mobile - React Native App

**Cross-platform iOS & Android mobile application for VitalTrack Health Monitoring System**

---

## 📋 Overview

VitalTrack Mobile is a React Native application that provides caregivers with real-time access to resident health monitoring. Built with TypeScript, Redux Toolkit, and Material Design 3, it offers a professional, native-feeling experience on both iOS and Android platforms.

---

## 🛠 Technology Stack

- **Framework**: React Native 0.72.4
- **Language**: TypeScript 5.1.6
- **State Management**: Redux Toolkit 1.9.5
- **Navigation**: React Navigation 6.x
- **UI Components**: React Native Paper 5.10 (Material Design 3)
- **HTTP Client**: Axios 1.5.0 (with auto token refresh)
- **WebSocket**: Socket.IO Client 4.7
- **Charts**: React Native Chart Kit 6.12
- **Storage**: AsyncStorage (via @react-native-async-storage)
- **Date Utilities**: Date-fns 2.30.0

---

## 📁 Project Structure

```
vitaltrack-mobile/
├── src/
│   ├── screens/                     → Application screens (7 total)
│   │   ├── LoginScreen.tsx          → Email/password/facility code login
│   │   ├── ForgotPasswordScreen.tsx → Password reset request
│   │   ├── ResetPasswordScreen.tsx  → Password reset with token
│   │   ├── DashboardScreen.tsx      → Resident list with search/filters
│   │   ├── ResidentDetailScreen.tsx → Resident profile, vitals, charts
│   │   ├── AlertsScreen.tsx         → Alert management (3 tabs)
│   │   └── ProfileScreen.tsx        → User profile and settings
│   │
│   ├── components/                  → Reusable components (15 total)
│   │   ├── common/
│   │   │   ├── Button.tsx          → Custom button with loading states
│   │   │   ├── TextInput.tsx       → Input with validation
│   │   │   ├── Card.tsx            → Pressable card container
│   │   │   ├── Badge.tsx           → Color-coded badges
│   │   │   └── EmptyState.tsx      → No data placeholder
│   │   ├── dashboard/
│   │   │   └── ResidentCard.tsx    → Resident list item
│   │   ├── resident/
│   │   │   ├── VitalIndicator.tsx  → Single vital display
│   │   │   ├── VitalStatsCard.tsx  → Vital statistics
│   │   │   └── AlertHistoryCard.tsx → Alert list
│   │   ├── charts/
│   │   │   └── VitalChart.tsx      → Line chart for vitals
│   │   └── alerts/
│   │       └── AlertCard.tsx        → Alert display with actions
│   │
│   ├── navigation/                  → Navigation configuration
│   │   ├── RootNavigator.tsx       → Root navigation (Auth/Main switch)
│   │   ├── AuthNavigator.tsx       → Auth screens stack
│   │   ├── MainNavigator.tsx       → Bottom tabs (Dashboard/Alerts/Profile)
│   │   └── types.ts                → Navigation type definitions
│   │
│   ├── store/                       → Redux state management
│   │   ├── store.ts                → Configure store + persist
│   │   ├── hooks.ts                → Typed useDispatch/useSelector
│   │   └── slices/
│   │       ├── authSlice.ts        → Authentication state
│   │       ├── residentsSlice.ts   → Residents data
│   │       ├── vitalsSlice.ts      → Vital signs data
│   │       └── alertsSlice.ts      → Alerts data
│   │
│   ├── services/                    → External services
│   │   ├── api.ts                  → Axios HTTP client
│   │   └── websocket.ts            → Socket.IO client
│   │
│   ├── types/                       → TypeScript type definitions
│   │   └── index.ts                → All app types
│   │
│   ├── theme/                       → Material Design theme
│   │   └── theme.ts                → Colors, typography, spacing
│   │
│   └── utils/                       → Utility functions
│       ├── formatters.ts           → Data formatting
│       └── validators.ts           → Input validation
│
├── android/                         → Android native code
├── ios/                            → iOS native code
├── App.tsx                         → Root component
├── index.js                        → Entry point
├── package.json
├── tsconfig.json
└── README.md                       → This file
```

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- React Native development environment set up
  - **iOS**: Xcode (Mac only)
  - **Android**: Android Studio

### **1. Install Dependencies**

```bash
npm install
```

### **2. iOS Setup** (Mac only)

```bash
cd ios
pod install
cd ..
```

### **3. Configure API Endpoint**

Edit `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'  // Your backend URL
  : 'https://api.vitaltrack.com/api';
```

For Android emulator, use `http://10.0.2.2:3000/api` instead of `localhost`.

### **4. Start Metro Bundler**

```bash
npm start
```

### **5. Run on iOS**

```bash
npm run ios

# Or specific simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

### **6. Run on Android**

```bash
npm run android

# Or specific device
npm run android -- --deviceId=<device_id>
```

---

## 📱 App Screens

### **Authentication Flow**

#### **1. LoginScreen**
- Email input
- Password input with toggle visibility
- Facility code input
- Form validation
- Navigate to Forgot Password

#### **2. ForgotPasswordScreen**
- Email input
- Facility code input
- Send reset email
- Success confirmation

#### **3. ResetPasswordScreen**
- Token input (from email)
- New password input
- Confirm password input
- Password strength meter

### **Main App Flow**

#### **4. DashboardScreen**
- Resident list with avatars
- Search bar (by name/room)
- Filter chips (All/Alerts/Normal/No Data)
- Pull-to-refresh
- Active alert badge

#### **5. ResidentDetailScreen**
- Resident profile card
- Live vital indicators (4 types)
- Interactive charts (1h/6h/24h/7d)
- Vital statistics
- Alert history

#### **6. AlertsScreen**
- Three tabs (Active/Acknowledged/Resolved)
- Search and filter
- Alert cards with action buttons
- Pull-to-refresh
- Real-time updates

#### **7. ProfileScreen**
- User info card
- Facility info card
- Change password
- Logout

---

## 🔄 State Management (Redux)

### **authSlice**
- User authentication
- JWT token management
- Auto token refresh
- Login/logout

### **residentsSlice**
- Resident list
- Selected resident
- Real-time updates

### **vitalsSlice**
- Vital signs data
- Statistics and trends
- Charts data

### **alertsSlice**
- Alert list (filtered)
- Alert statistics
- Acknowledge/resolve/escalate

---

## 🔌 Real-time Updates (WebSocket)

WebSocket automatically handles:
- `vital_update` → New vital signs
- `alert_created` → New alerts
- `alert_updated` → Alert status changes

Connection managed in `App.tsx` with auto-reconnection.

---

## 🎨 Theme System

Material Design 3 with custom colors:
- Primary: Blue (#2196F3)
- Secondary: Green (#4CAF50)
- Error: Red (#F44336)
- Warning: Orange (#FF9800)

---

## 🧪 Testing

### **Quick Test on Windows**

**Android Emulator:**
```bash
# Create virtual device in Android Studio
npm start
npm run android
```

**Physical Android Phone:**
```bash
# Enable Developer Mode + USB Debugging
# Connect via USB
npm start
npm run android
```

---

## 📦 Building for Production

### **Android APK**
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### **iOS IPA**
1. Open Xcode
2. Product → Archive
3. Distribute App

---

## 🛠 Development Scripts

```bash
npm start              # Start Metro bundler
npm run ios           # Run on iOS
npm run android       # Run on Android
npm test              # Run tests
npm run lint          # Check code style
npm run pod-install   # Install iOS pods
```

---

## 🐛 Troubleshooting

### **Metro Bundler Issues**
```bash
npm start -- --reset-cache
```

### **iOS Build Issues**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### **Android Build Issues**
```bash
cd android
./gradlew clean
cd ..
```

---

## 📞 Support

- Main Documentation: [../README.md](../README.md)
- Backend README: [../vitaltrack-backend/README.md](../vitaltrack-backend/README.md)

---

**VitalTrack Mobile** - Built with React Native, TypeScript, and Redux Toolkit

**Version**: 1.0.0 | **Status**: MVP Complete ✅
