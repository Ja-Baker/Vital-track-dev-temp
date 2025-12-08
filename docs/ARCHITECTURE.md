# VitalTrack System Architecture

## Overview

VitalTrack uses a modern microservices-inspired architecture with real-time data streaming from 4G cellular smartwatches to mobile and web clients.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVICES                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │ iSmarch Watch│    │ iSmarch Watch│    │ iSmarch Watch│     │
│   │   (4G/LTE)   │    │   (4G/LTE)   │    │   (4G/LTE)   │     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│          │                   │                   │               │
│          └───────────────────┼───────────────────┘               │
│                              │                                   │
│                    HTTPS POST every 30-60s                       │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUD INFRASTRUCTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   CloudFront CDN                         │   │
│   │              (SSL termination, caching)                  │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│   ┌───────────────────────┴─────────────────────────────────┐   │
│   │              Application Load Balancer                   │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│           ┌───────────────┴───────────────┐                     │
│           │                               │                      │
│   ┌───────┴───────┐             ┌────────┴────────┐             │
│   │  API Server   │             │ WebSocket Server│             │
│   │  (Node.js)    │             │   (Socket.io)   │             │
│   │  Auto-scale   │             │   Auto-scale    │             │
│   └───────┬───────┘             └────────┬────────┘             │
│           │                               │                      │
│           └───────────────┬───────────────┘                     │
│                           │                                      │
│   ┌───────────────────────┴─────────────────────────────────┐   │
│   │                    Message Queue                         │   │
│   │                  (Redis/RabbitMQ)                        │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│       ┌───────────────────┼───────────────────┐                 │
│       │                   │                   │                  │
│   ┌───┴────┐        ┌─────┴─────┐       ┌────┴────┐             │
│   │PostgreSQL│      │TimescaleDB│       │  Redis  │             │
│   │  (RDS)   │      │ (Vitals)  │       │ (Cache) │             │
│   │ Multi-AZ │      │Time-series│       │Sessions │             │
│   └──────────┘      └───────────┘       └─────────┘             │
│                                                                  │
│   External Services:                                             │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌───────────┐  │
│   │  S3    │ │  SES   │ │  SNS   │ │  Twilio  │ │CloudWatch │  │
│   │(Files) │ │(Email) │ │ (Push) │ │  (SMS)   │ │(Monitoring)│  │
│   └────────┘ └────────┘ └────────┘ └──────────┘ └───────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   iOS App    │    │  Web Admin   │    │ Family App   │     │
│   │ (Caregiver)  │    │  Dashboard   │    │   (Mobile)   │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Vital Data Ingestion

```
Watch → Backend → Storage → Alert Engine → Notifications
```

1. **Watch transmits** via 4G cellular every 30-60 seconds
2. **Backend validates** API key and device registration
3. **TimescaleDB stores** time-series vital data
4. **Alert engine checks** thresholds against resident-specific or facility defaults
5. **If alert triggered**:
   - Socket.io broadcasts to connected clients
   - Push notification via Firebase/APNS
   - SMS via Twilio (critical alerts)
   - Email via SendGrid

### 2. Webhook Endpoint

```javascript
POST /api/vitals/ingest
Content-Type: application/json
Authorization: Bearer <WATCH_API_KEY>

{
  "deviceId": "ISMARCH_12345",
  "timestamp": "2024-12-07T10:30:00Z",
  "vitals": {
    "heartRate": 72,
    "hrv": 45,
    "spo2": 97,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "skinTemperature": 98.2,
    "respiratoryRate": 16,
    "ecgStatus": "normal",
    "ecgWaveform": "base64_encoded_data"
  },
  "activity": {
    "steps": 3420,
    "activeMinutes": 145,
    "sleepScore": 82,
    "sleepDuration": 450
  },
  "events": {
    "fallDetected": false,
    "sosPressed": false,
    "watchRemoved": false
  },
  "location": {
    "gps": {
      "latitude": 38.9517,
      "longitude": -92.3341,
      "accuracy": 12
    },
    "insideGeofence": true
  },
  "device": {
    "batteryLevel": 65,
    "signalStrength": 4,
    "firmwareVersion": "2.1.3"
  }
}
```

### 3. Backend Processing Flow

```
1. Validate API key (each watch has unique auth token)
2. Verify deviceId is registered to a resident
3. Parse and validate all sensor data
4. Store raw data in TimescaleDB with resident_id
5. Run Alert Rules:
   - Get resident's custom thresholds (or facility defaults)
   - Check each vital against min/max bounds
   - If fall detected or SOS pressed → instant critical alert
   - If left geofence → location alert
6. If alert triggered:
   - Create Alert record in PostgreSQL
   - Emit Socket.io event to all connected caregivers
   - Send push notifications via Firebase
   - Send SMS via Twilio (critical alerts)
   - Log alert event
7. Return 200 OK to watch
```

## Tech Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 18+ | Server runtime |
| Framework | Express.js | REST API |
| Language | TypeScript | Type safety |
| Database (Relational) | PostgreSQL + Prisma | Users, residents, alerts |
| Database (Time-Series) | TimescaleDB | Vital readings (50M+ rows) |
| Real-Time | Socket.io | Live updates |
| Caching | Redis | Sessions, rate limiting |
| Message Queue | Redis/RabbitMQ | High-frequency data ingestion |

### iOS App (React Native)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React Native | Cross-platform mobile |
| Language | TypeScript | Type safety |
| Navigation | React Navigation | Screen routing |
| State | React Query / Zustand | Server state, caching |
| HTTP | Axios | API communication |
| WebSocket | socket.io-client | Real-time updates |
| Charts | Victory Native | Vital visualizations |
| Maps | react-native-maps | GPS/Location |
| Push | Firebase Cloud Messaging | Notifications |
| Storage | AsyncStorage | Offline caching |

### External Services
| Service | Provider | Purpose |
|---------|----------|---------|
| Email | SendGrid / AWS SES | Notifications, reports |
| SMS | Twilio | Critical alerts |
| Push Notifications | Firebase / APNS | Mobile alerts |
| File Storage | AWS S3 | Photos, exports, backups |
| Monitoring | CloudWatch + Sentry | Logs, errors, uptime |

## Database Schema Overview

### PostgreSQL Tables
- `users` - Admin, caregiver, family accounts
- `facilities` - Care facilities
- `residents` - Resident profiles
- `devices` - Watch devices
- `alerts` - Alert records
- `care_logs` - Caregiver documentation
- `audit_logs` - HIPAA compliance logging

### TimescaleDB Hypertables
- `vital_readings` - Time-series vital data (partitioned by time)

## Real-Time Communication

### Socket.io Events

**Client → Server:**
```javascript
socket.emit('join-facility', facilityId);
socket.emit('join-resident', residentId); // For family
```

**Server → Client:**
```javascript
// Vital update
socket.to(`facility-${facilityId}`).emit('vital-update', {
  residentId,
  vitals: { heartRate: 72, spo2: 97, ... },
  timestamp
});

// New alert
socket.to(`facility-${facilityId}`).emit('new-alert', {
  alertId,
  type: 'critical',
  category: 'sos',
  residentName: 'Mary Johnson',
  message: 'SOS button pressed'
});

// Alert acknowledged
socket.to(`facility-${facilityId}`).emit('alert-acknowledged', {
  alertId,
  acknowledgedBy: 'Jane Smith'
});

// Device status
socket.to(`facility-${facilityId}`).emit('device-status', {
  deviceId,
  status: 'offline',
  batteryLevel: 5
});
```

## Scalability Targets

| Metric | Target |
|--------|--------|
| Concurrent devices | 1,000+ |
| Vital readings/minute | 10,000+ |
| Concurrent users | 500+ |
| API response time | < 200ms |
| Vital ingestion time | < 100ms |
| Real-time latency | < 1 second |
| Database capacity | 50M+ vital readings |
| Uptime SLA | 99.9% |

## Device Commands

The backend can send commands to watches:

```javascript
// Adjust monitoring frequency
POST /api/devices/:deviceId/command
{
  "command": "adjust_monitoring_frequency",
  "params": {
    "heartRateInterval": 60,
    "gpsInterval": 300,
    "enableContinuousECG": false
  }
}

// Trigger vibration (SOS confirmation)
POST /api/devices/:deviceId/command
{
  "command": "trigger_vibration",
  "params": {
    "duration": 3000,
    "pattern": "sos_confirm"
  }
}

// Force GPS update
POST /api/devices/:deviceId/command
{
  "command": "locate",
  "params": { "forceGPSUpdate": true }
}
```

## Infrastructure as Code

### Terraform Example
```hcl
resource "aws_ecs_cluster" "vitaltrack" {
  name = "vitaltrack-production"
}

resource "aws_ecs_service" "api" {
  name            = "vitaltrack-api"
  cluster         = aws_ecs_cluster.vitaltrack.id
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
}

resource "aws_db_instance" "postgres" {
  identifier          = "vitaltrack-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.r6g.xlarge"
  allocated_storage   = 500
  multi_az            = true
  backup_retention_period = 35
}
```

## Disaster Recovery

| Metric | Target |
|--------|--------|
| RTO (Recovery Time) | 4 hours |
| RPO (Recovery Point) | 15 minutes |
| Backup frequency | Daily |
| Backup retention | 35 days |
| Cross-region replication | Enabled |
