# VitalTrack MVP Testing Guide

**Complete testing guide for VitalTrack health monitoring system with Cursor IDE integration**

---

## 🎯 Testing Overview

This guide provides comprehensive testing procedures for the VitalTrack MVP. Test within Cursor IDE using the integrated terminal and testing pipeline.

**MVP Status**: 95% Complete | **Ready for Testing**

---

## 🧪 Testing Pipeline for Cursor IDE

### Quick Start Pipeline

Run this complete testing pipeline in Cursor's integrated terminal:

```bash
# 1. Backend Testing Pipeline
cd vitaltrack-backend
npm install
npm run build
npm test
npm run lint

# 2. Mobile Testing Pipeline
cd ../vitaltrack-mobile
npm install
npm run lint
npm test

# 3. Integration Testing (both running)
# Terminal 1: Start backend
cd vitaltrack-backend && npm run dev

# Terminal 2: Start mobile
cd vitaltrack-mobile && npm start
```

---

## 📋 Pre-Testing Checklist

### Environment Setup

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] React Native environment configured
- [ ] Android Studio / Xcode installed
- [ ] Git repository cloned

### Database Preparation

```bash
# Create database
createdb vitaltrack

# Navigate to backend
cd vitaltrack-backend

# Run migrations
npm run migrate

# Seed with test data
npm run seed
```

---

## 🔧 Backend Testing (vitaltrack-backend)

### 1. Unit Tests

```bash
cd vitaltrack-backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- auth.test.ts
npm test -- residents.test.ts
npm test -- vitals.test.ts
npm test -- alerts.test.ts
```

### 2. API Endpoint Tests

**Test Login Endpoint:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "facilityCode": "FAC001"
  }'
```

**Test Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Test Get Residents (with auth):**
```bash
# Save token from login response
TOKEN="your_access_token_here"

curl http://localhost:3000/api/residents \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Database Tests

```bash
# Connect to database
psql -d vitaltrack

# Verify tables exist
\dt

# Check sample data
SELECT * FROM facilities;
SELECT * FROM users;
SELECT * FROM residents;
SELECT * FROM vitals LIMIT 10;
SELECT * FROM alerts LIMIT 10;

# Exit
\q
```

### 4. WebSocket Tests

Create `test-websocket.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  socket.emit('join_facility', { facilityId: 'YOUR_FACILITY_ID' });
});

socket.on('vital_update', (data) => {
  console.log('📊 Vital Update:', data);
});

socket.on('alert_created', (data) => {
  console.log('🚨 Alert Created:', data);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});
```

Run with:
```bash
node test-websocket.js
```

---

## 📱 Mobile Testing (vitaltrack-mobile)

### 1. Lint & Type Checks

```bash
cd vitaltrack-mobile

# Check TypeScript types
npx tsc --noEmit

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### 2. Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### 3. Component Testing

Test individual components in isolation:

```bash
# Test specific component
npm test -- Button.test.tsx
npm test -- AlertCard.test.tsx
npm test -- ResidentCard.test.tsx
```

### 4. End-to-End Testing (Manual)

**Run on Android Emulator:**
```bash
# Start Metro bundler
npm start

# In new terminal, run on Android
npm run android

# Or specific emulator
npm run android -- --deviceId=emulator-5554
```

**Run on iOS Simulator (Mac only):**
```bash
# Start Metro bundler
npm start

# In new terminal, run on iOS
npm run ios

# Or specific simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

**Run on Physical Device:**
```bash
# Android: Enable USB debugging, connect device
npm run android

# iOS: Configure signing in Xcode, connect device
npm run ios -- --device
```

---

## 🎬 User Acceptance Testing (UAT)

### Test Scenario 1: Authentication Flow

**Login Test:**
1. [ ] Open app → displays LoginScreen
2. [ ] Enter invalid email → shows validation error
3. [ ] Enter valid email but wrong password → shows "Invalid credentials"
4. [ ] Enter correct credentials → navigates to Dashboard
5. [ ] Check token stored in AsyncStorage
6. [ ] Force close app and reopen → still logged in

**Forgot Password Test:**
1. [ ] Click "Forgot Password"
2. [ ] Enter email and facility code
3. [ ] Submit → shows success message
4. [ ] Check backend logs for password reset email

**Change Password Test:**
1. [ ] Navigate to Profile screen
2. [ ] Click "Change Password"
3. [ ] Enter current password (wrong) → shows error
4. [ ] Enter current password (correct)
5. [ ] Enter new password < 8 chars → shows validation error
6. [ ] Enter valid new password → success
7. [ ] Logout and login with new password → works

**Logout Test:**
1. [ ] Click logout button
2. [ ] Confirm logout dialog
3. [ ] Redirected to LoginScreen
4. [ ] Token cleared from AsyncStorage
5. [ ] Cannot navigate back to authenticated screens

---

### Test Scenario 2: Dashboard Features

**Resident List:**
1. [ ] View all residents with avatars
2. [ ] Check resident status badges (Normal/Alert/No Data)
3. [ ] Verify room numbers display correctly
4. [ ] Check last vital timestamp formatting

**Search Functionality:**
1. [ ] Type resident name → filters results
2. [ ] Type room number → filters results
3. [ ] Clear search → shows all residents
4. [ ] Search with no matches → shows empty state

**Filter by Status:**
1. [ ] Click "All" chip → shows all residents
2. [ ] Click "Alerts" chip → shows only residents with active alerts
3. [ ] Click "Normal" chip → shows only residents with normal vitals
4. [ ] Click "No Data" chip → shows residents without recent vitals

**Pull to Refresh:**
1. [ ] Pull down list
2. [ ] Loading indicator appears
3. [ ] List refreshes with latest data
4. [ ] Badge counts update

**Navigation:**
1. [ ] Tap resident card
2. [ ] Navigate to ResidentDetailScreen
3. [ ] Back button returns to Dashboard

---

### Test Scenario 3: Resident Detail View

**Profile Display:**
1. [ ] Resident name displays correctly
2. [ ] Room number shows
3. [ ] Age calculated from date of birth
4. [ ] Emergency contact info displayed
5. [ ] Medical notes visible

**Live Vitals:**
1. [ ] Heart rate shows with icon and color coding
2. [ ] SpO2 shows with icon and color coding
3. [ ] Respiration rate shows with icon
4. [ ] Stress level shows with icon
5. [ ] Timestamp shows "X minutes ago"

**Vital Charts:**
1. [ ] Select "1 Hour" → chart updates
2. [ ] Select "6 Hours" → chart updates
3. [ ] Select "24 Hours" → chart updates
4. [ ] Select "7 Days" → chart updates
5. [ ] Chart displays data points correctly
6. [ ] Trend line visible
7. [ ] X-axis shows time labels
8. [ ] Y-axis shows value range

**Vital Statistics:**
1. [ ] Average value calculated correctly
2. [ ] Minimum value shows
3. [ ] Maximum value shows
4. [ ] Stats match chart data

**Alert History:**
1. [ ] Recent alerts listed
2. [ ] Alert type badge color-coded
3. [ ] Alert timestamp formatted
4. [ ] Alert message displayed
5. [ ] Tap alert → navigates to AlertsScreen

---

### Test Scenario 4: Alerts Management

**Tab Navigation:**
1. [ ] "Active" tab shows unacknowledged alerts
2. [ ] "Acknowledged" tab shows acknowledged alerts
3. [ ] "Resolved" tab shows resolved alerts
4. [ ] Badge counts display on each tab
5. [ ] Red badge on Active tab for critical alerts
6. [ ] Tab switches smoothly

**Alert Display:**
1. [ ] Resident avatar with initials
2. [ ] Resident name and room number
3. [ ] Alert type indicator (red/orange/blue bar)
4. [ ] Alert category (Heart Rate, SpO2, etc.)
5. [ ] Alert message
6. [ ] Related vital data
7. [ ] Status badge
8. [ ] Timestamp

**Search & Filter:**
1. [ ] Search by resident name → filters alerts
2. [ ] Search by room number → filters alerts
3. [ ] Filter by "Critical" → shows only critical alerts
4. [ ] Filter by "Warning" → shows only warnings
5. [ ] Filter by "Info" → shows only info alerts
6. [ ] Filter by "All" → shows all types
7. [ ] Combine search + filter → works correctly

**Alert Actions:**

**Acknowledge Alert:**
1. [ ] Find active alert
2. [ ] Click "Acknowledge" button
3. [ ] Button shows loading state
4. [ ] Alert moves to "Acknowledged" tab
5. [ ] Badge count updates
6. [ ] Real-time update via WebSocket

**Resolve Alert:**
1. [ ] Find acknowledged alert
2. [ ] Click "Resolve" button
3. [ ] Modal opens for resolution notes
4. [ ] Enter notes (optional)
5. [ ] Click "Resolve" in modal
6. [ ] Alert moves to "Resolved" tab
7. [ ] Badge count updates

**Escalate Alert:**
1. [ ] Find critical active alert
2. [ ] Click "Escalate" button
3. [ ] Confirmation dialog appears
4. [ ] Confirm escalation
5. [ ] Alert status updated
6. [ ] Notification sent (check backend logs)

**Navigate from Alert:**
1. [ ] Tap alert card
2. [ ] Navigate to ResidentDetailScreen
3. [ ] Correct resident displayed
4. [ ] Back navigation works

**Pull to Refresh:**
1. [ ] Pull down alert list
2. [ ] Loading indicator
3. [ ] Alert list and stats refresh

**Empty States:**
1. [ ] No active alerts → shows "No active alerts" message
2. [ ] No acknowledged alerts → shows appropriate message
3. [ ] No resolved alerts → shows appropriate message
4. [ ] No search results → shows "No alerts found"

---

### Test Scenario 5: Profile & Settings

**User Information:**
1. [ ] Avatar displays with correct initials
2. [ ] Full name displays
3. [ ] Email displays
4. [ ] Role badge shows (Administrator/Nurse/Caregiver)
5. [ ] Phone number displays (if available)
6. [ ] Last login timestamp formatted correctly

**Facility Information:**
1. [ ] Facility name displays
2. [ ] Facility code displays
3. [ ] Complete address shows
4. [ ] Phone number displays
5. [ ] Email displays

**Change Password:**
1. [ ] Click "Change Password"
2. [ ] Modal opens
3. [ ] Enter current password (wrong) → error
4. [ ] Enter current password (correct)
5. [ ] New password < 8 chars → validation error
6. [ ] New password ≠ confirm password → error
7. [ ] Valid passwords → success message
8. [ ] Modal closes
9. [ ] Can login with new password

**App Version:**
1. [ ] App version displays at bottom
2. [ ] Matches version in package.json

---

### Test Scenario 6: Real-Time Features

**Live Vital Updates:**
1. [ ] Backend running with WebSocket
2. [ ] Mobile app connected
3. [ ] Create new vital via API:
   ```bash
   curl -X POST http://localhost:3000/api/vitals/resident/RESIDENT_ID \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "heart_rate": 85,
       "spo2": 97,
       "respiration_rate": 18,
       "stress_level": 25
     }'
   ```
4. [ ] Dashboard updates automatically
5. [ ] ResidentDetail updates if viewing that resident
6. [ ] No manual refresh needed

**Live Alert Updates:**
1. [ ] Create critical vital that triggers alert
2. [ ] Alert appears on AlertsScreen automatically
3. [ ] Badge count updates
4. [ ] Alert card displays immediately
5. [ ] Notification sound/vibration (if implemented)

**WebSocket Reconnection:**
1. [ ] Disconnect WiFi
2. [ ] App shows connection lost
3. [ ] Reconnect WiFi
4. [ ] App automatically reconnects
5. [ ] Data syncs

---

## 🔄 Integration Testing

### Full System Test

**Setup (3 terminals in Cursor):**

```bash
# Terminal 1: Start PostgreSQL
# (Already running as service)

# Terminal 2: Start Backend
cd vitaltrack-backend
npm run dev

# Terminal 3: Start Mobile
cd vitaltrack-mobile
npm start
# Press 'a' for Android or 'i' for iOS
```

**Test Flow:**
1. [ ] Backend starts on port 3000
2. [ ] WebSocket server starts
3. [ ] Mobile connects to backend
4. [ ] Login successful
5. [ ] Residents load from database
6. [ ] Vitals display correctly
7. [ ] Alerts sync
8. [ ] Real-time updates work
9. [ ] All CRUD operations function
10. [ ] No console errors

---

## 🐛 Common Issues & Fixes

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in .env
DATABASE_URL=postgresql://user:pass@localhost:5432/vitaltrack
```

**Port Already in Use:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

**Migration Errors:**
```bash
# Reset database
npm run migrate:undo
npm run migrate
npm run seed
```

### Mobile Issues

**Metro Bundler Cache:**
```bash
npm start -- --reset-cache
```

**Android Build Fails:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS Pod Issues:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

**WebSocket Not Connecting:**
- Android emulator: Use `http://10.0.2.2:3000` instead of `localhost:3000`
- iOS simulator: `localhost:3000` should work
- Physical device: Use computer's local IP (e.g., `http://192.168.1.100:3000`)

---

## ✅ Testing Checklist Summary

### Critical Features (Must Pass)

- [ ] User can login
- [ ] Dashboard loads residents
- [ ] Can view resident details
- [ ] Vital charts display
- [ ] Alerts display and filter
- [ ] Can acknowledge alerts
- [ ] Can resolve alerts
- [ ] Real-time updates work
- [ ] WebSocket reconnects
- [ ] Can change password
- [ ] Can logout

### Nice-to-Have Features

- [ ] Search is fast
- [ ] Animations smooth
- [ ] No lag when scrolling
- [ ] Images load quickly
- [ ] Empty states helpful
- [ ] Error messages clear

---

## 📊 Test Results Template

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [Development/Staging/Production]
**Platform**: [iOS/Android]
**Device**: [Emulator/Physical]

### Test Results

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| Authentication | ✅/❌ | |
| Dashboard | ✅/❌ | |
| Resident Detail | ✅/❌ | |
| Alerts Management | ✅/❌ | |
| Profile & Settings | ✅/❌ | |
| Real-Time Updates | ✅/❌ | |

### Issues Found

1. **Issue Title**
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected result:
   - Actual result:
   - Screenshots:

### Overall Assessment

- Pass Rate: X%
- Critical Issues: X
- Ready for Production: Yes/No
```

---

## 🚀 Cursor IDE Testing Workflow

### Recommended Cursor Setup

1. **Split Terminal Layout:**
   - Terminal 1: Backend (`cd vitaltrack-backend && npm run dev`)
   - Terminal 2: Mobile (`cd vitaltrack-mobile && npm start`)
   - Terminal 3: Testing commands

2. **Useful Cursor Commands:**
   ```bash
   # Quick test backend
   cd vitaltrack-backend && npm test

   # Quick test mobile
   cd vitaltrack-mobile && npm test

   # Full system check
   npm run lint && npm test && npm run build
   ```

3. **Keyboard Shortcuts:**
   - `` Ctrl+` `` : Toggle terminal
   - `Ctrl+Shift+5` : Split terminal
   - `Ctrl+C` : Stop running process

---

## 📈 Performance Benchmarks

### Expected Performance

- **Login Response**: < 1 second
- **Dashboard Load**: < 2 seconds
- **Resident Detail Load**: < 1 second
- **Chart Render**: < 500ms
- **Alert Action**: < 1 second
- **WebSocket Latency**: < 100ms

### Monitoring

```bash
# Backend response times (add to backend)
# Check logs for timing information

# Mobile performance (React Native)
# Enable performance monitor in app
# Shake device → "Show Perf Monitor"
```

---

## 🎯 Test Coverage Goals

- **Backend**: > 80% code coverage
- **Mobile**: > 70% code coverage
- **Integration**: All critical paths tested
- **UAT**: All user stories validated

---

## 📞 Testing Support

For testing issues or questions:
- Check [README.md](../README.md)
- Review [Backend README](../vitaltrack-backend/README.md)
- Review [Mobile README](../vitaltrack-mobile/README.md)

---

**VitalTrack MVP Testing Guide**
**Version**: 1.0.0 | **Last Updated**: November 7, 2025
