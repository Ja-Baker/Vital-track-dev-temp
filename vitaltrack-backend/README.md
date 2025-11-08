# 🔧 VitalTrack Backend - API Server

**Node.js REST API + WebSocket Server for VitalTrack Health Monitoring System**

---

## 📋 Overview

The VitalTrack backend is a TypeScript-based Node.js server providing:
- RESTful API (35+ endpoints)
- Real-time WebSocket communication
- PostgreSQL database with Sequelize ORM
- JWT authentication with refresh tokens
- Role-based authorization
- Intelligent alerting engine
- HIPAA-compliant security

---

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript 5.1.6
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize 6.x
- **WebSocket**: Socket.IO 4.7
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: Bcrypt
- **Logging**: Winston
- **Validation**: Express-validator

---

## 📁 Project Structure

```
vitaltrack-backend/
├── src/
│   ├── models/                  → Sequelize database models
│   │   ├── Facility.ts
│   │   ├── User.ts
│   │   ├── Resident.ts
│   │   ├── ResidentThreshold.ts
│   │   ├── Vital.ts
│   │   ├── Alert.ts
│   │   └── index.ts
│   │
│   ├── controllers/             → Request handlers
│   │   ├── authController.ts    → Login, logout, password management
│   │   ├── userController.ts    → User CRUD operations
│   │   ├── residentController.ts → Resident management
│   │   ├── vitalController.ts   → Vital signs CRUD, stats, trends
│   │   └── alertController.ts   → Alert CRUD, acknowledge, resolve
│   │
│   ├── services/                → Business logic layer
│   │   ├── authService.ts       → Authentication logic
│   │   ├── residentService.ts   → Resident operations
│   │   ├── vitalService.ts      → Vital processing
│   │   ├── alertService.ts      → Alert creation/management
│   │   └── notificationService.ts → Alert notifications
│   │
│   ├── routes/                  → API endpoint definitions
│   │   ├── authRoutes.ts        → /api/auth/*
│   │   ├── userRoutes.ts        → /api/users/*
│   │   ├── residentRoutes.ts    → /api/residents/*
│   │   ├── vitalRoutes.ts       → /api/vitals/*
│   │   ├── alertRoutes.ts       → /api/alerts/*
│   │   └── index.ts
│   │
│   ├── middleware/              → Request processing
│   │   ├── auth.ts              → JWT verification
│   │   ├── authorization.ts     → Role checking
│   │   ├── validation.ts        → Input validation
│   │   └── errorHandler.ts      → Error responses
│   │
│   ├── websocket/               → Real-time features
│   │   ├── socketHandlers.ts    → WebSocket event handlers
│   │   └── alertingEngine.ts    → Alert evaluation logic
│   │
│   ├── config/                  → Configuration
│   │   ├── database.ts          → PostgreSQL connection
│   │   └── environment.ts       → Environment variables
│   │
│   ├── utils/                   → Utilities
│   │   ├── logger.ts            → Winston logging
│   │   ├── jwt.ts               → Token generation/verification
│   │   └── encryption.ts        → Password hashing
│   │
│   └── server.ts                → Express app setup
│
├── .env.example                 → Environment variables template
├── package.json
├── tsconfig.json
└── README.md                    → This file
```

---

## 🚀 Quick Start

### **1. Prerequisites**

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn

### **2. Install Dependencies**

```bash
npm install
```

### **3. Environment Configuration**

Create `.env` file from template:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vitaltrack
# Or individual settings:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vitaltrack
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:8081

# Logging
LOG_LEVEL=info
```

### **4. Database Setup**

```bash
# Create database
createdb vitaltrack

# Run migrations (creates tables)
npm run migrate

# Seed database with sample data (optional)
npm run seed
```

### **5. Start Development Server**

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### **6. Verify Installation**

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {"success": true, "message": "VitalTrack API is running"}
```

---

## 📡 API Endpoints

### **Authentication** (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with email, password, facility code | No |
| POST | `/auth/logout` | Logout (invalidate tokens) | Yes |
| POST | `/auth/refresh` | Refresh access token | No (refresh token) |
| POST | `/auth/change-password` | Change user password | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| GET | `/auth/me` | Get current user | Yes |

### **Users** (`/api/users`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/users` | Get all users | Yes | Admin |
| GET | `/users/:id` | Get user by ID | Yes | Admin, Self |
| POST | `/users` | Create new user | Yes | Admin |
| PUT | `/users/:id` | Update user | Yes | Admin, Self |
| DELETE | `/users/:id` | Delete user | Yes | Admin |

### **Residents** (`/api/residents`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/residents` | Get all residents in facility | Yes |
| GET | `/residents/:id` | Get resident by ID | Yes |
| POST | `/residents` | Create new resident | Yes (Admin/Nurse) |
| PUT | `/residents/:id` | Update resident | Yes (Admin/Nurse) |
| DELETE | `/residents/:id` | Delete resident | Yes (Admin) |
| GET | `/residents/:id/vitals` | Get resident vitals | Yes |
| GET | `/residents/:id/alerts` | Get resident alerts | Yes |
| GET | `/residents/:id/thresholds` | Get resident thresholds | Yes |
| PUT | `/residents/:id/thresholds` | Update thresholds | Yes (Admin/Nurse) |

### **Vitals** (`/api/vitals`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/vitals` | Get all vitals | Yes |
| GET | `/vitals/:id` | Get vital by ID | Yes |
| POST | `/vitals/resident/:id` | Create vital for resident | Yes |
| GET | `/vitals/resident/:id/latest` | Get latest vital | Yes |
| GET | `/vitals/resident/:id/stats` | Get vital statistics | Yes |
| GET | `/vitals/resident/:id/trends` | Get vital trends | Yes |

### **Alerts** (`/api/alerts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/alerts` | Get all alerts (filterable) | Yes |
| GET | `/alerts/:id` | Get alert by ID | Yes |
| GET | `/alerts/resident/:id` | Get resident alerts | Yes |
| GET | `/alerts/stats` | Get alert statistics | Yes |
| POST | `/alerts/:id/acknowledge` | Acknowledge alert | Yes |
| POST | `/alerts/:id/resolve` | Resolve alert | Yes |
| POST | `/alerts/:id/escalate` | Escalate alert | Yes |

---

## 🔌 WebSocket Events

### **Client → Server**

| Event | Data | Description |
|-------|------|-------------|
| `join_facility` | `{ facilityId }` | Join facility room for updates |
| `leave_facility` | `{ facilityId }` | Leave facility room |

### **Server → Client**

| Event | Data | Description |
|-------|------|-------------|
| `vital_update` | `{ residentId, data }` | New vital signs received |
| `alert_created` | `{ alert }` | New alert created |
| `alert_updated` | `{ alert }` | Alert status changed |
| `error` | `{ message }` | Error occurred |

---

## 🗄 Database Schema

### **Tables**

#### **facilities**
```sql
id (UUID, PK)
name (String)
facility_code (String, Unique)
address, city, state, zip_code
phone_number, email
is_active (Boolean)
created_at, updated_at
```

#### **users**
```sql
id (UUID, PK)
facility_id (FK → facilities)
email (String, Unique)
password_hash (String)
first_name, last_name
role (Enum: admin, nurse, caregiver)
phone_number
is_active (Boolean)
last_login_at
created_at, updated_at
```

#### **residents**
```sql
id (UUID, PK)
facility_id (FK → facilities)
first_name, last_name
date_of_birth
room_number
garmin_device_id
photo_url
medical_notes
emergency_contact_name, emergency_contact_phone
is_active (Boolean)
created_at, updated_at
```

#### **resident_thresholds**
```sql
id (UUID, PK)
resident_id (FK → residents, Unique)
heart_rate_min, heart_rate_max
spo2_min
respiration_rate_min, respiration_rate_max
stress_level_max
created_at, updated_at
```

#### **vitals**
```sql
id (UUID, PK)
resident_id (FK → residents)
timestamp (DateTime)
heart_rate, spo2, respiration_rate, stress_level
steps, calories
source (String)
raw_data (JSON)
created_at
```

#### **alerts**
```sql
id (UUID, PK)
resident_id (FK → residents)
alert_type (Enum: critical, warning, info)
category (Enum: heart_rate, spo2, respiration_rate, stress_level, fall_detected, device_disconnected)
message (String)
vital_data (JSON)
status (Enum: active, acknowledged, resolved, escalated)
acknowledged_by (FK → users, Nullable)
acknowledged_at (DateTime, Nullable)
resolved_by (FK → users, Nullable)
resolved_at (DateTime, Nullable)
resolution_notes (String, Nullable)
escalated_at (DateTime, Nullable)
created_at, updated_at
```

---

## 🔐 Security Features

### **Password Security**
- Bcrypt hashing with 10 salt rounds
- Never store plain text passwords

### **JWT Authentication**
- Access tokens: 15 minute expiry
- Refresh tokens: 7 day expiry
- Signed with secret key
- Automatic token rotation

### **Authorization**
- Role-based access control (RBAC)
- Facility isolation (users only see their facility)
- Route-level permission checks

### **Input Validation**
- Express-validator for request validation
- SQL injection prevention via Sequelize ORM
- XSS protection

### **HIPAA Compliance**
- Audit logging for all data access
- Encrypted data at rest
- Secure communication (HTTPS in production)

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

---

## 🚢 Deployment

### **Production Environment Variables**

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<strong-secret-key>
CORS_ORIGIN=https://your-app.com
LOG_LEVEL=warn
```

### **Deployment Platforms**

#### **Heroku**
```bash
heroku create vitaltrack-api
heroku addons:create heroku-postgresql:standard-0
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

#### **AWS EC2 + RDS**
1. Launch EC2 instance
2. Create RDS PostgreSQL database
3. Install Node.js on EC2
4. Clone repo and install dependencies
5. Set environment variables
6. Use PM2 for process management
7. Configure NGINX as reverse proxy

#### **DigitalOcean App Platform**
1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Configure run command: `npm start`
4. Add PostgreSQL database
5. Set environment variables

---

## 📊 Monitoring & Logging

### **Winston Logger**

Logs are written to:
- Console (development)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

### **Log Levels**
- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `debug`: Debugging information

---

## 🛠 Development Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm start           # Run compiled code

# Database
npm run migrate      # Run migrations
npm run migrate:undo # Rollback migration
npm run seed         # Seed database

# Testing
npm test            # Run tests
npm run test:watch  # Watch mode

# Linting
npm run lint        # Check code style
npm run lint:fix    # Fix code style
```

---

## 🐛 Troubleshooting

### **Database Connection Error**
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U username -d vitaltrack
```

### **Port Already in Use**
```bash
# Change PORT in .env
PORT=3001
```

### **JWT Token Issues**
```bash
# Make sure JWT_SECRET is set in .env
# Tokens expire after 15 minutes (access) / 7 days (refresh)
```

---

## 📞 Support

- Main Documentation: [../README.md](../README.md)
- API Reference: [../docs/API_REFERENCE.md](../docs/API_REFERENCE.md)

---

**VitalTrack Backend** - Built with Node.js, Express, TypeScript, and PostgreSQL
