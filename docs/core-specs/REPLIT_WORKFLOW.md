# Replit Development Workflow for VitalTrack

## Overview

Use Replit Agent to build VitalTrack's React Native iOS app and Node.js backend code. Then deploy to your own HIPAA-compliant infrastructure.

## What Replit Builds

### Frontend (React Native iOS App)
✅ All screens and UI components
✅ State management (Zustand stores)
✅ API integration (Axios client)
✅ Socket.io client for real-time updates
✅ Push notification handlers
✅ Charts and visualizations
✅ Authentication UI flow
✅ Offline caching logic

### Backend (Node.js/Express API)
✅ API route handlers
✅ Data models and TypeScript types
✅ Middleware (authentication, validation)
✅ Socket.io server code
✅ Database queries (PostgreSQL/Prisma)
✅ File upload handling
✅ Alert generation logic

## What Replit CANNOT Do

❌ Host production backend with PHI
❌ Provide HIPAA-compliant database
❌ Sign Business Associate Agreements
❌ Configure TLS certificates
❌ Set up Redis cache
❌ Configure S3 file storage
❌ Enable audit logging infrastructure
❌ Manage encryption keys

## Development Workflow

### Step 1: Generate Code with Replit Agent

1. **Create Replit Project**
   ```
   Choose template: Node.js or React
   Project name: vitaltrack-backend (for API)
              or vitaltrack-ios (for mobile app)
   ```

2. **Use Replit Agent to Build Features**

   Example prompts:
   ```
   "Build the Resident List Screen according to UI_SPEC.md.
   Include search, filtering, and pull-to-refresh functionality."

   "Create the authentication API endpoints from API_SPEC.md.
   Include login, logout, and token refresh routes."

   "Implement the VitalCard component from UI_SPEC.md with
   real-time updates from Socket.io."
   ```

3. **Test in Replit Environment**
   - Use mock data for residents/vitals
   - Test UI components in Replit preview
   - Test API endpoints with Postman/Thunder Client

### Step 2: Export Code from Replit

1. **Download Project**
   - Click "Download as zip" from Replit
   - Extract to local development folder

2. **Set Up Local Development**
   ```bash
   # For backend
   cd vitaltrack-backend
   npm install

   # Create .env file (see DEPLOYMENT_GUIDE.md)
   cp .env.example .env

   # For mobile app
   cd vitaltrack-ios
   npm install
   npx pod-install (iOS only)
   ```

### Step 3: Connect to Your Infrastructure

1. **Backend Configuration**
   Update `.env` to point to your hosted services:
   ```
   DATABASE_URL=postgresql://your-hosted-db
   REDIS_URL=redis://your-redis-instance
   AWS_S3_BUCKET=your-s3-bucket
   ```

2. **Mobile App Configuration**
   Update `.env` with your API endpoint:
   ```
   API_BASE_URL=https://your-api.yourdomain.com/api
   SOCKET_URL=wss://your-api.yourdomain.com
   ```

### Step 4: Deploy to Production

Follow `DEPLOYMENT_GUIDE.md` for full deployment procedures.

## Iterative Development Pattern

```
┌─────────────────────────────────────────┐
│ 1. Describe feature to Replit Agent    │
│    (Reference DEVELOPMENT_PHASES.md)    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 2. Replit builds code                   │
│    - Generates React components         │
│    - Creates API endpoints              │
│    - Sets up state management           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 3. Test with mock data in Replit       │
│    - Preview UI in Replit               │
│    - Test API with sample requests      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 4. Export and deploy to your infra     │
│    - Download code from Replit          │
│    - Connect to real database           │
│    - Deploy to HIPAA-compliant hosting  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 5. Test with real data                  │
│    - Verify HIPAA compliance            │
│    - Run security checks                │
│    - Performance testing                │
└─────────────────────────────────────────┘
```

## Best Practices

### Keep Code Separated
```
replit-workspace/
├── vitaltrack-backend/      # API code
├── vitaltrack-ios/          # Mobile app code
└── vitaltrack-docs/         # Specifications
```

### Use Mock Data in Replit
Never use real PHI in Replit development:
```typescript
// Good: Mock data for development
const mockResident = {
  id: "res_001",
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "1950-01-01",
  // ...
};

// Bad: Real patient data
// NEVER DO THIS IN REPLIT
```

### Version Control
- Use Git to track changes
- Push to GitHub/GitLab after each Replit session
- Keep deployment code separate from Replit code

### Environment Variables
- Never commit secrets to Replit
- Use Replit Secrets for API keys during development
- Rotate all keys before production deployment

## Troubleshooting

### "Cannot connect to database"
- Replit doesn't provide PostgreSQL/TimescaleDB
- Use SQLite for local development in Replit
- Connect to real database after deployment

### "Redis not available"
- Replit doesn't provide Redis
- Use in-memory cache for Replit development
- Connect to real Redis after deployment

### "Socket.io connection fails"
- Configure Socket.io URL in environment variables
- Test Socket.io server separately
- Verify WebSocket support on hosting platform

### "Push notifications not working"
- Firebase requires real certificates
- Test with development certificates
- Configure production certificates after deployment

## Next Steps

After Replit builds your code:
1. Follow `DEPLOYMENT_GUIDE.md` to set up infrastructure
2. Complete `HIPAA_COMPLIANCE_CHECKLIST.md` before handling PHI
3. Review `SECURITY.md` for security implementation details
