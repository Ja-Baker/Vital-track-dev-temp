# VitalTrack - Senior Health Monitoring Platform

## Overview
VitalTrack is a real-time health monitoring application for senior care facilities. It enables caregivers to monitor residents' vital signs, receive alerts, and manage care documentation.

## Current State
- **Phase 1 Complete**: Foundation & Authentication
- **Phase 2 Complete**: Core Data & Resident Management
- **Phase 3 Complete**: Real-time Vitals & Alert System
- Full-stack application with React frontend and Node.js/Express backend
- PostgreSQL database with complete schema
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Caregiver, Family)
- Real-time capabilities via Socket.io
- Interactive dashboard with navigation tabs
- Resident list with search/filter functionality
- Resident detail view with vital charts

## Demo Credentials
- **Admin**: admin@sunnyacres.com / admin123
- **Caregiver**: jane.smith@sunnyacres.com / admin123

## Features Implemented

### Phase 1: Authentication & Foundation
- Secure JWT authentication with refresh tokens
- Role-based access control (Admin, Caregiver, Family)
- HIPAA-ready audit logging
- PostgreSQL database with healthcare schema

### Phase 2: Resident Management
- Dashboard with real-time stats and alerts
- Navigation tabs: Dashboard, Residents, Alerts, Analytics, Settings
- Resident grid with status indicators (Normal/Warning/Critical)
- Search and filter by name, room, status
- Resident detail modal with tabs:
  - Vitals tab with current readings and 24h charts
  - Activity tab with steps, sleep, active time
  - Alerts tab for resident-specific alerts
  - Care Log tab for documentation
- Real-time vital charts using Recharts
- Socket.io client for live updates

### Phase 3: Real-time Vitals & Alert System
- Vital sign simulator generating realistic data every 30 seconds
- Threshold-based alert engine (heart rate, SpO2, temperature)
- Critical and warning severity levels with automatic deduplication
- Socket.io real-time broadcasts for vital updates and new alerts
- Frontend synchronized with live data streams
- Battery and signal strength tracking for devices

## Project Structure
```
/
├── src/
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── App.jsx        # Main application component
│   │   │   ├── main.jsx       # Entry point
│   │   │   └── index.css      # Global styles
│   │   ├── index.html
│   │   └── vite.config.js
│   ├── server/                 # Express backend
│   │   ├── index.js           # Server entry point
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js        # Authentication endpoints
│   │       ├── residents.js   # Resident management
│   │       ├── alerts.js      # Alert management
│   │       └── facilities.js  # Facility endpoints
│   └── db/
│       ├── index.js           # Database connection
│       ├── schema.sql         # Database schema
│       └── seed.sql           # Demo data
├── docs/                       # Specification documents
│   └── core-specs/
├── run.js                      # Application runner
└── package.json
```

## Tech Stack
- **Frontend**: React 19, Vite, Recharts
- **Backend**: Node.js, Express 5
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Auth**: JWT with bcrypt password hashing

## API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/residents` - List residents with search/filter
- `GET /api/residents/:id` - Get resident details
- `GET /api/residents/:id/vitals/latest` - Get latest vitals
- `GET /api/residents/:id/vitals/history` - Get vital history for charts
- `GET /api/alerts` - List alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/resolve` - Resolve alert
- `GET /api/facilities/:id/stats` - Facility statistics

## Database Tables
- `facilities` - Care facility information
- `users` - User accounts with roles
- `residents` - Resident profiles
- `devices` - Smartwatch devices
- `vital_readings` - Vital sign measurements
- `alerts` - Health alerts
- `care_logs` - Care documentation
- `audit_logs` - HIPAA compliance logging
- `refresh_tokens` - JWT refresh tokens

## Development Commands
- `npm run dev` - Start development servers
- `npm run server` - Start API server only
- `npm run client` - Start frontend only
- `npm run db:seed` - Seed database with demo data

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (configured)
- `JWT_REFRESH_SECRET` - Refresh token secret (configured)
- `PORT` - API server port (default: 3001)

## Next Development Phases
1. ~~Phase 1: Foundation & Authentication~~ ✓
2. ~~Phase 2: Core Data & Resident Management~~ ✓
3. ~~Phase 3: Real-time Vitals & Alert System~~ ✓
4. **Phase 4**: Location, Geofencing & Fall Detection
5. **Phase 5**: Care Logs & Analytics Dashboard
6. **Phase 6**: Security & HIPAA Preparation
