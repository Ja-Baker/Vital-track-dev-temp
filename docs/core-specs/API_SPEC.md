# VitalTrack API Specification

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-api.railway.app/api`

## Authentication

All endpoints (except login) require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

### Token Lifecycle
- Access token expires in 30 minutes
- Refresh token expires in 7 days
- Use `/auth/refresh` to get new access token

---

## Authentication Endpoints

### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "email": "user@facility.com",
  "password": "password123",
  "facilityCode": "DEMO001"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_123",
    "email": "user@facility.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "caregiver",
    "facilityId": "fac_456"
  }
}
```

### POST /auth/logout
Invalidate current token.

### POST /auth/refresh
Get new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@facility.com"
}
```

### POST /auth/reset-password
Reset password with token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newPassword123!"
}
```

---

## Facility Endpoints

### GET /facilities
Get all facilities (admin only).

**Response:**
```json
{
  "facilities": [
    {
      "id": "fac_456",
      "name": "Sunny Acres AL",
      "address": "123 Care Lane",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "timezone": "America/Chicago",
      "phone": "(555) 123-4567",
      "capacity": 50,
      "residentCount": 42,
      "alertThresholds": {
        "heartRate": { "min": 40, "max": 130 },
        "spo2": { "min": 88 },
        "bloodPressure": {
          "systolicMin": 90, "systolicMax": 180,
          "diastolicMin": 60, "diastolicMax": 110
        },
        "temperature": { "max": 99.5 }
      }
    }
  ]
}
```

### GET /facilities/:id
Get single facility details.

### POST /facilities
Create new facility (admin only).

### PUT /facilities/:id
Update facility (admin only).

### PUT /facilities/:id/geofence
Update facility geofence boundary (admin only).

**Request:**
```json
{
  "geofence": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], ...]]
  }
}
```

---

## Resident Endpoints

### GET /residents
Get all residents for user's facility.

**Query Parameters:**
- `status`: Filter by status (active, discharged, etc.)
- `search`: Search by name or room number
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:**
```json
{
  "residents": [
    {
      "id": "res_789",
      "firstName": "Mary",
      "lastName": "Johnson",
      "dateOfBirth": "1945-03-15",
      "gender": "F",
      "roomNumber": "101",
      "photoUrl": "https://s3.../photo.jpg",
      "status": "active",
      "currentStatus": "normal",
      "latestVitals": {
        "heartRate": 72,
        "spo2": 97,
        "bloodPressure": { "systolic": 120, "diastolic": 80 },
        "temperature": 98.2,
        "timestamp": "2024-12-07T10:30:00Z"
      },
      "device": {
        "id": "dev_123",
        "batteryLevel": 65,
        "signalStrength": 4,
        "lastSyncAt": "2024-12-07T10:30:00Z",
        "status": "active"
      },
      "location": {
        "description": "Dining Room",
        "insideGeofence": true
      },
      "activeAlerts": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 42,
    "pages": 1
  }
}
```

### GET /residents/:id
Get single resident with full details.

**Response:**
```json
{
  "id": "res_789",
  "firstName": "Mary",
  "lastName": "Johnson",
  "dateOfBirth": "1945-03-15",
  "gender": "F",
  "roomNumber": "101",
  "photoUrl": "https://s3.../photo.jpg",
  "status": "active",
  "admissionDate": "2023-06-15",

  "medicalConditions": ["Hypertension", "Type 2 Diabetes"],
  "medications": [
    { "name": "Metformin", "dosage": "500mg", "frequency": "twice daily" }
  ],
  "allergies": ["Penicillin"],

  "emergencyContacts": [
    {
      "name": "John Johnson",
      "relationship": "Son",
      "phone": "(555) 987-6543",
      "isPrimary": true
    }
  ],

  "customThresholds": {
    "heartRate": { "min": 50, "max": 120 }
  },

  "baselineMetrics": {
    "avgHeartRate": 68,
    "avgSpo2": 96,
    "avgStepsPerDay": 2500,
    "typicalSleepDuration": 420
  },

  "device": {
    "id": "dev_123",
    "model": "iSmarch X6",
    "firmwareVersion": "2.1.3",
    "batteryLevel": 65,
    "signalStrength": 4,
    "status": "active",
    "lastSyncAt": "2024-12-07T10:30:00Z",
    "pairedAt": "2024-01-15T08:00:00Z"
  }
}
```

### POST /residents
Create new resident (admin only).

### PUT /residents/:id
Update resident (admin only).

### PUT /residents/:id/thresholds
Update custom alert thresholds (admin only).

**Request:**
```json
{
  "customThresholds": {
    "heartRate": { "min": 50, "max": 120 },
    "spo2": { "min": 90 }
  }
}
```

### POST /residents/:id/photo
Upload resident photo.

---

## Vitals Endpoints

### GET /residents/:id/vitals/latest
Get latest vital reading for resident.

**Response:**
```json
{
  "residentId": "res_789",
  "timestamp": "2024-12-07T10:30:00Z",
  "vitals": {
    "heartRate": 72,
    "hrv": 45,
    "spo2": 97,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "skinTemperature": 98.2,
    "respiratoryRate": 16,
    "ecgStatus": "normal"
  },
  "activity": {
    "steps": 3420,
    "activeMinutes": 145,
    "sleepScore": 82
  },
  "location": {
    "description": "Dining Room",
    "gps": { "latitude": 38.9517, "longitude": -92.3341 },
    "insideGeofence": true
  },
  "device": {
    "batteryLevel": 65,
    "signalStrength": 4
  }
}
```

### GET /residents/:id/vitals
Get vital history with time range.

**Query Parameters:**
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `type`: Specific vital type (heartRate, spo2, etc.)
- `interval`: Aggregation interval (1m, 5m, 1h, 1d)

**Response:**
```json
{
  "residentId": "res_789",
  "from": "2024-12-06T00:00:00Z",
  "to": "2024-12-07T00:00:00Z",
  "interval": "1h",
  "data": [
    {
      "timestamp": "2024-12-06T00:00:00Z",
      "heartRate": { "avg": 68, "min": 62, "max": 75 },
      "spo2": { "avg": 96.5, "min": 95, "max": 98 },
      "bloodPressure": {
        "systolic": { "avg": 118, "min": 112, "max": 125 },
        "diastolic": { "avg": 78, "min": 72, "max": 82 }
      }
    }
  ]
}
```

### POST /vitals/ingest
Webhook endpoint for device data (device API key auth).

**Headers:**
```
Authorization: Bearer <DEVICE_API_KEY>
Content-Type: application/json
```

**Request:** (See ARCHITECTURE.md for full payload)

### POST /residents/:id/vitals/export
Export vital data as CSV or PDF.

**Request:**
```json
{
  "format": "csv",
  "from": "2024-12-01T00:00:00Z",
  "to": "2024-12-07T00:00:00Z",
  "types": ["heartRate", "spo2", "bloodPressure"]
}
```

---

## Alert Endpoints

### GET /alerts
Get all alerts for facility.

**Query Parameters:**
- `status`: pending, acknowledged, resolved, false_alarm
- `type`: critical, warning, info
- `category`: fall, vitals, sos, location, device
- `residentId`: Filter by resident
- `from`: Start date
- `to`: End date
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "alerts": [
    {
      "id": "alt_123",
      "residentId": "res_789",
      "residentName": "Mary Johnson",
      "roomNumber": "101",
      "type": "critical",
      "category": "sos",
      "title": "SOS Button Pressed",
      "message": "Mary Johnson pressed SOS button in Room 101",
      "status": "pending",
      "createdAt": "2024-12-07T10:30:00Z",
      "triggeringValue": null,
      "location": {
        "description": "Room 101",
        "gps": { "latitude": 38.9517, "longitude": -92.3341 }
      }
    }
  ],
  "stats": {
    "pending": 2,
    "acknowledged": 5,
    "resolved": 120,
    "avgResponseTime": 138
  }
}
```

### GET /alerts/:id
Get single alert with full details.

### POST /alerts/:id/acknowledge
Acknowledge an alert.

**Response:**
```json
{
  "id": "alt_123",
  "status": "acknowledged",
  "acknowledgedBy": "usr_456",
  "acknowledgedAt": "2024-12-07T10:32:00Z",
  "timeToAcknowledge": 120
}
```

### POST /alerts/:id/resolve
Resolve an alert.

**Request:**
```json
{
  "outcome": "false_alarm",
  "notes": "Resident accidentally pressed button, no emergency."
}
```

### POST /alerts/:id/escalate
Escalate alert to admin.

### GET /alerts/stats
Get alert statistics.

**Response:**
```json
{
  "today": {
    "total": 15,
    "critical": 2,
    "warning": 8,
    "info": 5,
    "avgResponseTime": 145,
    "falseAlarmRate": 0.12
  },
  "byHour": [
    { "hour": 0, "count": 2 },
    { "hour": 1, "count": 1 }
  ],
  "byCategory": {
    "vitals": 8,
    "fall": 2,
    "device": 5
  }
}
```

---

## Device Endpoints

### GET /devices
Get all devices (admin only).

**Response:**
```json
{
  "devices": [
    {
      "id": "dev_123",
      "model": "iSmarch X6",
      "firmwareVersion": "2.1.3",
      "simCardNumber": "89012...",
      "cellularCarrier": "AT&T",
      "residentId": "res_789",
      "residentName": "Mary Johnson",
      "status": "active",
      "batteryLevel": 65,
      "signalStrength": 4,
      "lastSyncAt": "2024-12-07T10:30:00Z",
      "dataTransmissionSuccessRate": 99.2
    }
  ],
  "stats": {
    "total": 50,
    "online": 48,
    "offline": 2,
    "lowBattery": 3
  }
}
```

### GET /devices/:id
Get device details.

### POST /devices
Register new device (admin only).

**Request:**
```json
{
  "id": "IMEI_123456789",
  "model": "iSmarch X6",
  "simCardNumber": "89012...",
  "cellularCarrier": "AT&T"
}
```

### POST /devices/:id/pair
Assign device to resident (admin only).

**Request:**
```json
{
  "residentId": "res_789"
}
```

### POST /devices/:id/unpair
Unassign device from resident (admin only).

### POST /devices/:id/command
Send command to device.

**Request:**
```json
{
  "command": "locate",
  "params": { "forceGPSUpdate": true }
}
```

**Available Commands:**
- `adjust_monitoring_frequency`
- `trigger_vibration`
- `locate`
- `reboot`
- `factory_reset` (admin only)

---

## Care Log Endpoints

### GET /residents/:id/care-logs
Get care logs for resident.

**Response:**
```json
{
  "careLogs": [
    {
      "id": "log_123",
      "type": "vital_check",
      "content": "Checked on resident, vitals normal.",
      "caregiverId": "usr_456",
      "caregiverName": "Jane Smith",
      "timestamp": "2024-12-07T10:30:00Z",
      "alertId": null
    }
  ]
}
```

### POST /residents/:id/care-logs
Create care log entry.

**Request:**
```json
{
  "type": "incident",
  "content": "Resident reported feeling dizzy, monitored for 30 minutes.",
  "severity": "minor",
  "alertId": "alt_123"
}
```

---

## User Endpoints

### GET /users
Get all users (admin only).

### GET /users/:id
Get user details.

### POST /users/invite
Invite new user (admin only).

**Request:**
```json
{
  "email": "newuser@facility.com",
  "role": "caregiver",
  "firstName": "John",
  "lastName": "Doe"
}
```

### PUT /users/:id
Update user profile.

### PUT /users/:id/notifications
Update notification preferences.

**Request:**
```json
{
  "notificationPreferences": {
    "email": true,
    "sms": true,
    "push": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "06:00"
  }
}
```

---

## Analytics Endpoints

### GET /analytics/facility/:facilityId/overview
Get facility overview metrics.

### GET /analytics/facility/:facilityId/alerts
Get alert analytics.

### GET /analytics/resident/:residentId/weekly-report
Get weekly health report for resident.

---

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'caregiver' | 'family';
  firstName: string;
  lastName: string;
  phone: string;
  facilityId?: string;
  residentId?: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  createdAt: Date;
  lastLogin?: Date;
}
```

### Resident
```typescript
interface Resident {
  id: string;
  facilityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'Other';
  roomNumber: string;
  photoUrl?: string;
  watchDeviceId?: string;
  medicalConditions: string[];
  medications: { name: string; dosage: string; frequency: string }[];
  allergies: string[];
  emergencyContacts: {
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }[];
  customThresholds?: AlertThresholds;
  baselineMetrics?: BaselineMetrics;
  status: 'active' | 'discharged' | 'hospitalized' | 'deceased';
  admissionDate: Date;
}
```

### VitalReading
```typescript
interface VitalReading {
  id: string;
  residentId: string;
  deviceId: string;
  timestamp: Date;
  heartRate?: number;
  hrv?: number;
  spo2?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  skinTemperature?: number;
  respiratoryRate?: number;
  ecgStatus?: 'normal' | 'irregular' | 'error';
  steps?: number;
  activeMinutes?: number;
  sleepScore?: number;
  fallDetected: boolean;
  sosPressed: boolean;
  gpsLocation?: { latitude: number; longitude: number; accuracy: number };
  insideGeofence: boolean;
  batteryLevel: number;
  signalStrength: number;
}
```

### Alert
```typescript
interface Alert {
  id: string;
  residentId: string;
  facilityId: string;
  type: 'critical' | 'warning' | 'info';
  category: 'fall' | 'vitals' | 'sos' | 'location' | 'device' | 'activity';
  title: string;
  message: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'false_alarm';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  outcome?: string;
  caregiverNotes?: string;
  escalated: boolean;
  familyNotified: boolean;
  createdAt: Date;
}
```

### Device
```typescript
interface Device {
  id: string;
  model: string;
  firmwareVersion: string;
  simCardNumber: string;
  cellularCarrier: string;
  apiKey: string;
  residentId?: string;
  facilityId: string;
  status: 'active' | 'offline' | 'deactivated';
  batteryLevel: number;
  signalStrength: number;
  lastSyncAt: Date;
  dataTransmissionSuccessRate: number;
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| /auth/login | 5 requests per 15 min |
| /vitals/ingest | 1000 requests per min |
| All other endpoints | 100 requests per min |
