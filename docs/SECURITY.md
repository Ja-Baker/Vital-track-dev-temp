# VitalTrack Security & HIPAA Compliance

## Overview

VitalTrack handles Protected Health Information (PHI) and must comply with HIPAA regulations. This document outlines security requirements and implementation guidelines.

---

## Authentication & Authorization

### JWT Token Strategy

| Token Type | Expiration | Purpose |
|------------|------------|---------|
| Access Token | 30 minutes | API authentication |
| Refresh Token | 7 days | Get new access token |
| Device API Key | Never (revocable) | Watch authentication |

### Password Requirements
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special symbol
- No common passwords (dictionary check)
- No password reuse (last 10 passwords)

### Authentication Security
- Rate limiting: 5 login attempts per 15 minutes
- Account lockout after 10 failed attempts (30 min)
- 2FA optional for admins (TOTP via authenticator app)
- Session timeout: 30 min inactivity
- Concurrent session limit: 3 devices per user
- Secure password reset via email with expiring tokens

### Implementation Example

```typescript
// JWT Token Generation
import jwt from 'jsonwebtoken';

const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, facilityId: user.facilityId },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenType: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
```

---

## Role-Based Access Control (RBAC)

### Permission Matrix

| Resource | Action | Admin | Caregiver | Family |
|----------|--------|-------|-----------|--------|
| Facilities | View | Own | Assigned | No |
| Facilities | Modify | Yes | No | No |
| Residents | View All | Yes | Assigned Facility | No |
| Residents | View Single | Yes | Assigned Facility | Own Only |
| Residents | Modify | Yes | No | No |
| Vitals | View | Yes | Assigned Facility | Own Only |
| Vitals | Export | Yes | Yes | Own Only |
| Alerts | View | Yes | Assigned Facility | Own Critical |
| Alerts | Acknowledge | Yes | Assigned Facility | No |
| Alerts | Resolve | Yes | Assigned Facility | No |
| Users | View | Yes | No | No |
| Users | Modify | Yes | Self Only | Self Only |
| Devices | Manage | Yes | View Only | No |
| Audit Logs | View | Yes | No | No |

### Middleware Implementation

```typescript
// Authorization Middleware
const checkPermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role, facilityId, residentId } = req.user;

    // Admin has full access to their facilities
    if (role === 'admin') {
      if (req.params.facilityId && req.params.facilityId !== facilityId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return next();
    }

    // Caregiver can access assigned facility
    if (role === 'caregiver') {
      if (resource === 'resident' && action === 'view') {
        // Verify resident belongs to caregiver's facility
        const resident = await Resident.findById(req.params.id);
        if (resident?.facilityId !== facilityId) {
          return res.status(403).json({ error: 'Access denied' });
        }
        return next();
      }
    }

    // Family can only access their assigned resident
    if (role === 'family') {
      if (resource === 'resident' && req.params.id !== residentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Only allow view actions
      if (!['view', 'view_vitals'].includes(action)) {
        return res.status(403).json({ error: 'Action not permitted' });
      }
      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  };
};

// Usage
app.get('/api/residents/:id',
  authenticate,
  checkPermission('resident', 'view'),
  getResident
);
```

---

## Data Encryption

### In Transit
- TLS 1.3 for all API communications
- Certificate pinning for mobile apps
- mTLS (mutual TLS) for device authentication
- WebSocket connections over WSS

### At Rest
- AES-256 encryption for PHI fields in database
- Encrypted database backups
- Separate encryption keys per facility (optional)
- Key rotation every 90 days

### Encrypted Fields
| Table | Encrypted Fields |
|-------|------------------|
| residents | medicalConditions, medications, allergies, emergencyContacts |
| care_logs | content, photoUrls |
| users | phone (optional) |

### Implementation Example

```typescript
// Field-level encryption using crypto
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

const decrypt = (encryptedText: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
```

---

## Audit Logging

### HIPAA Requirement
All access to PHI must be logged with:
- Who accessed (user ID, name, role)
- What was accessed (resource type, resource ID)
- When (timestamp)
- From where (IP address, user agent)
- What action was performed

### Audit Log Schema

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;

  // Who
  userId: string;
  userName: string;
  userRole: 'admin' | 'caregiver' | 'family';

  // What
  action: AuditAction;
  resourceType: 'resident' | 'vital' | 'alert' | 'user' | 'device' | 'facility';
  resourceId: string;

  // Where
  ipAddress: string;
  userAgent: string;

  // Details
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'view_resident'
  | 'view_vitals'
  | 'export_data'
  | 'acknowledge_alert'
  | 'resolve_alert'
  | 'modify_threshold'
  | 'create_user'
  | 'modify_user'
  | 'delete_user'
  | 'pair_device'
  | 'unpair_device';
```

### Audit Log Middleware

```typescript
const auditLog = (action: AuditAction, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture original end function
    const originalEnd = res.end;

    res.end = function(...args) {
      // Log after response is sent
      const log: AuditLog = {
        id: uuid(),
        timestamp: new Date(),
        userId: req.user?.id,
        userName: `${req.user?.firstName} ${req.user?.lastName}`,
        userRole: req.user?.role,
        action,
        resourceType,
        resourceId: req.params.id || req.body?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: res.statusCode < 400,
        metadata: {
          method: req.method,
          path: req.path,
          responseTime: Date.now() - startTime,
          statusCode: res.statusCode
        }
      };

      // Store async (don't block response)
      AuditLogService.create(log).catch(console.error);

      return originalEnd.apply(this, args);
    };

    next();
  };
};

// Usage
app.get('/api/residents/:id',
  authenticate,
  auditLog('view_resident', 'resident'),
  getResident
);
```

### Audit Log Retention
- Minimum retention: 7 years (HIPAA requirement)
- Stored in separate database/table
- Read-only after creation (immutable)
- Searchable and exportable for compliance audits

### Suspicious Activity Alerts
Automatically alert on:
- Multiple failed login attempts (>3 in 5 min)
- Data export by family member
- Access outside normal hours (10pm-6am)
- Bulk data access (>50 records in 1 min)
- Access from new IP address
- Concurrent sessions from different locations

---

## Device Security

### Watch Authentication
- Each device has unique API key
- API keys are never exposed to users
- Keys can be revoked instantly
- mTLS for device-to-server communication

### Device Registration Flow
```
1. Admin enters device IMEI in system
2. System generates unique API key
3. API key is securely transmitted to device (manufacturer portal)
4. Device stores API key in secure enclave
5. All transmissions include API key in Authorization header
```

### Device Data Validation
```typescript
const validateVitalData = (data: any): boolean => {
  // Validate device ID exists and is registered
  const device = await Device.findById(data.deviceId);
  if (!device || device.status !== 'active') {
    throw new Error('Invalid or inactive device');
  }

  // Validate timestamp is recent (prevent replay attacks)
  const timestamp = new Date(data.timestamp);
  const now = new Date();
  const diff = Math.abs(now.getTime() - timestamp.getTime());
  if (diff > 5 * 60 * 1000) { // 5 minutes
    throw new Error('Timestamp too old');
  }

  // Validate vital ranges (reject obviously invalid data)
  if (data.vitals.heartRate < 20 || data.vitals.heartRate > 300) {
    throw new Error('Invalid heart rate');
  }
  if (data.vitals.spo2 < 50 || data.vitals.spo2 > 100) {
    throw new Error('Invalid SpO2');
  }

  return true;
};
```

---

## Data Retention & Deletion

### Retention Periods

| Data Type | Active | Post-Discharge | Total |
|-----------|--------|----------------|-------|
| Resident Profile | Indefinite | 7 years | 7+ years |
| Vital Readings (granular) | 2 years | Aggregated | 2 years |
| Vital Readings (daily avg) | Indefinite | 7 years | 7+ years |
| Alerts | Indefinite | 7 years | 7+ years |
| Care Logs | Indefinite | 7 years | 7+ years |
| Audit Logs | Indefinite | 7 years | 7+ years |
| User Accounts | Active + 30 days | N/A | Active + 30 days |

### Data Deletion Procedures

**Resident Discharge:**
```typescript
const dischargeResident = async (residentId: string) => {
  // 1. Update status to discharged
  await Resident.update(residentId, {
    status: 'discharged',
    dischargeDate: new Date()
  });

  // 2. Unpair device
  await Device.unpair(resident.watchDeviceId);

  // 3. Revoke family access
  await User.revokeAccessForResident(residentId);

  // 4. Schedule data retention cleanup (7 years from now)
  await DataRetention.scheduleCleanup({
    residentId,
    cleanupDate: addYears(new Date(), 7)
  });

  // 5. Log action
  await AuditLog.create({
    action: 'discharge_resident',
    resourceType: 'resident',
    resourceId: residentId
  });
};
```

**Right to Access (HIPAA):**
Family members can request complete data export:
```typescript
const exportResidentData = async (residentId: string, requesterId: string) => {
  // Verify requester has access
  const user = await User.findById(requesterId);
  if (user.residentId !== residentId) {
    throw new Error('Access denied');
  }

  // Gather all data
  const data = {
    resident: await Resident.findById(residentId),
    vitals: await Vital.findByResident(residentId),
    alerts: await Alert.findByResident(residentId),
    careLogs: await CareLog.findByResident(residentId)
  };

  // Generate PDF report
  const pdf = await generatePDFReport(data);

  // Log export
  await AuditLog.create({
    action: 'export_data',
    resourceType: 'resident',
    resourceId: residentId,
    metadata: { requesterId, format: 'pdf' }
  });

  return pdf;
};
```

---

## Network Security

### API Security Headers
```typescript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### CORS Configuration
```typescript
app.use(cors({
  origin: [
    'https://vitaltrack.app',
    'https://admin.vitaltrack.app',
    /\.vitaltrack\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests' }
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many login attempts' }
});

// High limit for vital ingestion
const vitalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 per minute (for all devices)
  message: { error: 'Rate limit exceeded' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/vitals/ingest', vitalLimiter);
```

---

## Disaster Recovery

### Backup Strategy
| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| PostgreSQL | Daily | 35 days | S3 (encrypted) |
| TimescaleDB | Daily | 35 days | S3 (encrypted) |
| Redis | Hourly | 7 days | S3 (encrypted) |
| Audit Logs | Daily | 7 years | S3 Glacier |
| Photos/Files | Real-time | Indefinite | S3 (versioned) |

### Recovery Objectives
| Metric | Target |
|--------|--------|
| RTO (Recovery Time) | 4 hours |
| RPO (Recovery Point) | 15 minutes |
| Cross-region failover | 1 hour |

### Disaster Recovery Procedures
1. Database restore from S3 backup
2. Application redeploy via CI/CD
3. DNS failover to backup region
4. Verify data integrity
5. Notify users of incident

### Quarterly DR Drills
- Full system restore test
- Failover to secondary region
- Data integrity verification
- Document lessons learned

---

## Security Checklist

### Development
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (tokens)
- [ ] Secure headers configured
- [ ] Dependencies scanned for vulnerabilities
- [ ] Secrets stored in environment variables

### Deployment
- [ ] TLS 1.3 enabled
- [ ] Certificate pinning configured
- [ ] Database encrypted at rest
- [ ] Backups encrypted
- [ ] Firewall rules configured
- [ ] VPC isolation
- [ ] Monitoring and alerting enabled

### Compliance
- [ ] Audit logging implemented
- [ ] Access controls enforced
- [ ] Data retention policies configured
- [ ] BAA signed with cloud provider
- [ ] Security training for staff
- [ ] Incident response plan documented
- [ ] Annual security assessment

---

## Incident Response

### Classification
| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Data breach, system down | 15 minutes |
| High | Security vulnerability, partial outage | 1 hour |
| Medium | Performance degradation | 4 hours |
| Low | Minor issues | 24 hours |

### Response Steps
1. **Detect** - Monitoring alerts or user report
2. **Contain** - Isolate affected systems
3. **Investigate** - Determine root cause
4. **Remediate** - Fix the issue
5. **Recover** - Restore normal operations
6. **Report** - Document incident, notify affected parties
7. **Review** - Post-incident analysis, improve defenses

### Breach Notification
HIPAA requires notification within 60 days:
- Affected individuals
- HHS (Health and Human Services)
- Media (if >500 individuals affected)
