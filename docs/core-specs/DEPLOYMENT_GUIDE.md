# VitalTrack Deployment Guide

## Overview

After Replit builds your code, deploy to HIPAA-compliant infrastructure.

## Infrastructure Requirements

### Required Services

1. **Backend Hosting (Node.js/Express)**
   - Options: AWS EC2, GCP Compute Engine, Azure VMs
   - Must support: HTTPS, WebSockets, long-running processes

2. **Database (PostgreSQL + TimescaleDB)**
   - Options: AWS RDS, Google Cloud SQL, self-hosted
   - Requirements: Encryption at rest, automated backups

3. **Cache Layer (Redis)**
   - Options: AWS ElastiCache, Google MemoryStore

4. **File Storage (S3-compatible)**
   - For: Resident photos, data exports, backups
   - Requirements: Server-side encryption, versioning

5. **Real-time (Socket.io)**
   - Requires WebSocket support on hosting platform

### Network & Security
- TLS 1.3 certificates (Let's Encrypt or commercial CA)
- Firewall configuration
- VPC/network isolation
- DDoS protection

### Monitoring & Logging
- Application monitoring (Datadog, New Relic, CloudWatch)
- Error tracking (Sentry)
- Audit log storage (separate database or S3 Glacier)

---

## Deployment Steps

### Phase 1: Infrastructure Setup (Before Code Deployment)

1. **Choose cloud provider with BAA capability**
   - AWS, Google Cloud, or Azure
   - Verify they offer BAA for HIPAA compliance
   - Review pricing for healthcare-tier services

2. **Sign BAA with provider**
   - Contact enterprise sales
   - Legal review and signature
   - Keep documentation for audits

3. **Provision database (PostgreSQL + TimescaleDB extension)**
   ```bash
   # AWS RDS example
   aws rds create-db-instance \
     --db-instance-identifier vitaltrack-db \
     --db-instance-class db.t3.medium \
     --engine postgres \
     --allocated-storage 100 \
     --storage-encrypted \
     --master-username admin \
     --master-user-password <secure-password>

   # Enable TimescaleDB extension
   psql -h <rds-endpoint> -U admin -d vitaltrack
   CREATE EXTENSION IF NOT EXISTS timescaledb;
   ```

4. **Set up Redis cache**
   ```bash
   # AWS ElastiCache example
   aws elasticache create-cache-cluster \
     --cache-cluster-id vitaltrack-redis \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --num-cache-nodes 1
   ```

5. **Configure S3 buckets with encryption**
   ```bash
   # Create S3 bucket
   aws s3api create-bucket \
     --bucket vitaltrack-uploads \
     --region us-east-1

   # Enable encryption
   aws s3api put-bucket-encryption \
     --bucket vitaltrack-uploads \
     --server-side-encryption-configuration \
     '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket vitaltrack-uploads \
     --versioning-configuration Status=Enabled
   ```

6. **Set up TLS certificates**
   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d api.vitaltrack.com
   ```

### Phase 2: Backend Deployment

1. **Deploy Express API to hosting service**
   ```bash
   # Example: Deploy to AWS EC2
   ssh ec2-user@<instance-ip>

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Clone your repo
   git clone https://github.com/yourorg/vitaltrack-backend.git
   cd vitaltrack-backend
   npm install
   ```

2. **Configure environment variables**
   Create `.env` file (see Environment Variables section below)

3. **Run database migrations**
   ```bash
   npm run migrate
   npm run seed  # Optional: seed with initial data
   ```

4. **Verify Socket.io WebSocket connections**
   ```bash
   # Start server
   npm run start

   # Test WebSocket connection
   wscat -c wss://api.vitaltrack.com
   ```

5. **Test API endpoints**
   ```bash
   # Health check
   curl https://api.vitaltrack.com/health

   # Login test
   curl -X POST https://api.vitaltrack.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@facility.com","password":"test123"}'
   ```

### Phase 3: Mobile App Deployment

1. **Configure API endpoint URLs in app**
   Create `vitaltrack-ios/.env`:
   ```
   API_BASE_URL=https://api.vitaltrack.com/api
   SOCKET_URL=wss://api.vitaltrack.com
   ```

2. **Set up Firebase Cloud Messaging**
   - Create Firebase project
   - Download `GoogleService-Info.plist`
   - Add to iOS project
   - Configure APNs certificates

3. **Build iOS app with Xcode**
   ```bash
   cd vitaltrack-ios
   npm install
   cd ios && pod install && cd ..

   # Open in Xcode
   open ios/VitalTrack.xcworkspace
   ```

4. **Upload to TestFlight for testing**
   - Archive in Xcode (Product → Archive)
   - Upload to App Store Connect
   - Add internal testers
   - Test thoroughly

5. **Submit to App Store**
   - Complete App Store listing
   - Submit for review
   - Address any feedback
   - Release when approved

### Phase 4: HIPAA Compliance Configuration

See `HIPAA_COMPLIANCE_CHECKLIST.md` for complete checklist.

---

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/vitaltrack
TIMESCALEDB_URL=postgresql://user:pass@host:5432/vitaltrack

# Redis
REDIS_URL=redis://host:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=<your-encryption-key>

# AWS S3
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=vitaltrack-uploads
AWS_REGION=us-east-1

# Firebase
FIREBASE_PROJECT_ID=<your-project>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<private-key>

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://admin.vitaltrack.com,https://vitaltrack.com
```

### iOS App (.env)
```bash
# API Configuration
API_BASE_URL=https://api.vitaltrack.com/api
SOCKET_URL=wss://api.vitaltrack.com

# Firebase
FIREBASE_CONFIG=<firebase-config-json>

# App Configuration
APP_ENV=production
```

---

## Cost Estimates (Monthly)

### Small Deployment (1 facility, 50 residents)
| Service | Cost |
|---------|------|
| Hosting (EC2 t3.medium) | $50-100 |
| Database (RDS t3.medium) | $50-100 |
| Redis (ElastiCache t3.micro) | $20-50 |
| S3 Storage | $10-20 |
| Monitoring & Logging | $20-50 |
| **Total** | **~$150-320/month** |

### Medium Deployment (5 facilities, 250 residents)
| Service | Cost |
|---------|------|
| Hosting (EC2 t3.large) | $200-400 |
| Database (RDS t3.large) | $150-300 |
| Redis (ElastiCache t3.small) | $50-100 |
| S3 Storage | $30-50 |
| Monitoring & Logging | $50-100 |
| **Total** | **~$480-950/month** |

### Large Deployment (20 facilities, 1000 residents)
| Service | Cost |
|---------|------|
| Hosting (Multiple EC2 instances) | $800-1500 |
| Database (RDS r5.xlarge) | $500-800 |
| Redis (ElastiCache r5.large) | $200-350 |
| S3 Storage | $100-200 |
| Monitoring & Logging | $100-200 |
| **Total** | **~$1700-3050/month** |

---

## Backup & Disaster Recovery

### Backup Strategy

**PostgreSQL:**
- Daily automated backups, 35-day retention
- Transaction log archiving for point-in-time recovery
- Encrypted backups stored in S3

**Redis:**
- Hourly snapshots
- 7-day retention
- RDB persistence enabled

**S3 Files:**
- Versioning enabled
- Cross-region replication for critical data
- Lifecycle policies for archival

**Audit Logs:**
- S3 Glacier for long-term storage
- 7-year retention (HIPAA requirement)
- Immutable storage class

### Disaster Recovery

**Objectives:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 15 minutes

**Procedures:**
1. Database restore from latest backup
2. Application redeploy from Git
3. DNS failover to backup region
4. Verify data integrity
5. Notify users of incident

**Quarterly DR Drills:**
- Schedule quarterly disaster recovery tests
- Document results and lessons learned
- Update procedures based on findings
- Train staff on DR procedures

---

## Scaling Considerations

### Horizontal Scaling

**Load Balancer:**
```bash
# AWS Application Load Balancer
aws elbv2 create-load-balancer \
  --name vitaltrack-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx
```

**Database Read Replicas:**
- Create read replicas for reporting queries
- Route read-only queries to replicas
- Reduce load on primary database

**Redis Cluster Mode:**
- Enable Redis cluster for high availability
- Automatic failover
- Data sharding across nodes

**CDN for Static Assets:**
- CloudFront or similar CDN
- Cache API responses where appropriate
- Reduce latency for global users

### Vertical Scaling

**Monitor and Adjust:**
- CPU/memory usage monitoring
- Database connection pooling
- API rate limiting
- Auto-scaling groups

**Database Optimization:**
- Regular VACUUM and ANALYZE
- Index optimization
- Query performance tuning
- Connection pooling (PgBouncer)

---

## Security Configuration

### Firewall Rules

```bash
# Example: AWS Security Group rules
# Allow HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow database access only from app servers
aws ec2 authorize-security-group-ingress \
  --group-id sg-database \
  --protocol tcp \
  --port 5432 \
  --source-group sg-app
```

### VPC Isolation

- Place database and Redis in private subnets
- Use NAT gateway for outbound internet access
- Application servers in public subnet with security groups
- No direct internet access to database

### TLS Configuration

**Nginx Example:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.vitaltrack.com;

    ssl_certificate /etc/letsencrypt/live/api.vitaltrack.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vitaltrack.com/privkey.pem;

    ssl_protocols TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## Monitoring & Alerting

### Application Monitoring

**CloudWatch (AWS) or Equivalent:**
- CPU/Memory usage
- Disk I/O
- Network traffic
- Custom application metrics

**Error Tracking:**
```javascript
// Sentry integration
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Remove PHI from error reports
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  }
});
```

### Alert Configuration

Set up alerts for:
- API response time > 2 seconds
- Error rate > 1%
- Database connections > 80% capacity
- Disk usage > 80%
- Failed login attempts > 10 in 5 minutes
- Unauthorized API access attempts

---

## Deployment Checklist

Before going live:

- [ ] All services provisioned and configured
- [ ] Environment variables set correctly
- [ ] Database migrations run successfully
- [ ] TLS certificates installed and verified
- [ ] Backups configured and tested
- [ ] Monitoring and alerting active
- [ ] Security groups/firewall rules configured
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] HIPAA compliance checklist completed (see HIPAA_COMPLIANCE_CHECKLIST.md)
- [ ] Staff training completed
- [ ] Incident response plan in place
- [ ] Documentation updated

---

## Support Resources

- **AWS HIPAA Compliance:** https://aws.amazon.com/compliance/hipaa-compliance/
- **GCP HIPAA Compliance:** https://cloud.google.com/security/compliance/hipaa
- **Azure HIPAA Compliance:** https://azure.microsoft.com/en-us/resources/microsoft-azure-compliance-and-hipaa/
- **TimescaleDB Documentation:** https://docs.timescale.com/
- **Socket.io Documentation:** https://socket.io/docs/
