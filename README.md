# VitalTrack

Real-time health monitoring for senior care facilities.

This is a full-stack application that connects wearable devices to a mobile app, letting caregivers monitor residents' vitals as they happen. Built it to be HIPAA-compliant from the ground up.

## Project Status

Current version: **1.0.0** (MVP - about 95% done)
Last updated: November 7, 2025

## Project Structure

```
VitalTrack/
├── vitaltrack-backend/     # Node.js + Express REST API & WebSocket server
├── vitaltrack-mobile/      # React Native mobile application
└── docs/                   # Complete project documentation
    ├── MVP_COMPLETE.md         # MVP completion status & features
    ├── MVP_TESTING_GUIDE.md    # Comprehensive testing guide
    ├── CURRENT_PROGRESS.md     # Development progress tracking
    ├── DOCUMENTATION_INDEX.md  # Documentation navigation hub
    ├── PROJECT_SUMMARY.md      # Technical overview & architecture
    └── VitalTrack_Presentation.pdf
```

## Getting Started

### What you'll need

- Node.js 18 or later
- PostgreSQL 14 or later
- React Native dev environment (Xcode for iOS, Android Studio for Android)

### Backend Setup

```bash
# Navigate to backend
cd vitaltrack-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database
createdb vitaltrack
npm run migrate
npm run seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`

### Mobile Setup

```bash
# Navigate to mobile
cd vitaltrack-mobile

# Install dependencies
npm install

# iOS setup (Mac only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS (in new terminal)
npm run ios

# Run on Android (in new terminal)
npm run android
```

## Testing

There's a full testing guide in [docs/MVP_TESTING_GUIDE.md](docs/MVP_TESTING_GUIDE.md) if you need it.

Quick version:

```bash
# Backend tests
cd vitaltrack-backend
npm test
npm run lint

# Mobile tests
cd vitaltrack-mobile
npm test
npm run lint
```

## What's Built

### Backend
- 35+ REST API endpoints
- Real-time WebSocket communication
- JWT auth with refresh tokens
- Role-based access (Admin/Nurse/Caregiver)
- PostgreSQL database (6 tables)
- Alert engine that watches for anomalies
- HIPAA-compliant security

### Mobile App

The app has 7 screens: login/forgot password/reset password, main dashboard with resident list, detailed resident view with vitals and charts, alerts screen with filtering, and a profile screen.

Built 15+ reusable components including buttons, inputs, cards, badges, vital indicators, charts, and alert cards.

Real-time stuff works through WebSocket - vital updates, instant alerts, auto-reconnection when network drops, badge counts updating live.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **WebSocket**: Socket.IO
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Bcrypt, CORS, Helmet

### Mobile
- **Framework**: React Native 0.72
- **Language**: TypeScript
- **State**: Redux Toolkit
- **Navigation**: React Navigation 6
- **UI**: React Native Paper (Material Design 3)
- **HTTP**: Axios with auto token refresh
- **WebSocket**: Socket.IO Client
- **Charts**: React Native Chart Kit

## Documentation

- [MVP_COMPLETE.md](docs/MVP_COMPLETE.md) - Feature list and completion status
- [MVP_TESTING_GUIDE.md](docs/MVP_TESTING_GUIDE.md) - Testing guide
- [CURRENT_PROGRESS.md](docs/CURRENT_PROGRESS.md) - Development timeline
- [PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) - Technical architecture details
- [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) - Doc navigation
- [Backend README](vitaltrack-backend/README.md) - Backend API docs
- [Mobile README](vitaltrack-mobile/README.md) - Mobile app docs

## Security

- JWT authentication with automatic token refresh
- Role-based access control (RBAC)
- Bcrypt password hashing
- HIPAA-compliant data handling
- SQL injection prevention
- XSS protection
- Encrypted communications
- Audit logging

## WebSocket Events

The app listens for these real-time events:
- `vital_update` - Live vital signs
- `alert_created` - New alerts
- `alert_updated` - Alert status changes
- `resident_status_update` - Resident status changes

Connection handles network drops with exponential backoff and auto-reconnects seamlessly.

## Design

Using Material Design 3 with a custom palette:
- Primary: Blue (#2196F3)
- Secondary: Green (#4CAF50)
- Error/Critical: Red (#F44336)
- Warning: Orange (#FF9800)

## What's Left

About 5% to go, mostly polish:
- Push notifications (infrastructure's ready)
- Dark mode (theme system's ready)
- Better offline support
- Analytics
- Accessibility improvements

Then testing, optimization, and deployment. Should be production-ready in a week or two.

## Deployment

### Backend Deployment

**Heroku:**
```bash
heroku create vitaltrack-api
heroku addons:create heroku-postgresql
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

**DigitalOcean / AWS:**
- Deploy PostgreSQL database
- Deploy Node.js server
- Configure environment variables
- Enable HTTPS/SSL

### Mobile Deployment

**Android:**
```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/
```

**iOS:**
1. Open Xcode
2. Product → Archive
3. Distribute to App Store

## Troubleshooting

### Backend

Database connection:
```bash
pg_isready
psql -d vitaltrack
```

Port already in use (Windows):
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Mobile

Clear Metro cache:
```bash
npm start -- --reset-cache
```

Android build issues:
```bash
cd android && ./gradlew clean && cd ..
```

iOS pod issues:
```bash
cd ios && rm -rf Pods && pod install && cd ..
```

Check [MVP_TESTING_GUIDE.md](docs/MVP_TESTING_GUIDE.md) for more.

## License

MIT

---

Built with React Native, Node.js, PostgreSQL, and TypeScript.
