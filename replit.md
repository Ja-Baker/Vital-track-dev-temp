# VitalTrack Documentation

## Overview
VitalTrack is a documentation/specification repository for a real-time health monitoring system designed for senior care facilities. This repository contains the complete specifications and development guides for building the VitalTrack application.

**Note:** This is a documentation-only project. The actual application code has been archived to a separate branch. The current setup serves the documentation as a static website.

## Current State
- Documentation server running on port 5000
- Renders markdown documentation files as styled HTML pages
- Navigation includes: API Spec, Development Phases, Security, UI Spec

## Project Structure
```
/
├── server.js           # Express server for documentation
├── README.md           # Project overview
├── docs/
│   └── core-specs/
│       ├── API_SPEC.md              # Full API specification
│       ├── DEPLOYMENT_GUIDE.md      # Deployment instructions
│       ├── DEVELOPMENT_PHASES.md    # Development roadmap
│       ├── HIPAA_COMPLIANCE_CHECKLIST.md
│       ├── REPLIT_WORKFLOW.md
│       ├── SECURITY.md              # Security requirements
│       └── UI_SPEC.md               # UI design specifications
└── package.json
```

## Tech Stack
- Node.js with Express
- Marked (markdown parser)

## Available Routes
- `/` - Home (README)
- `/docs/api` - API Specification
- `/docs/development` - Development Phases
- `/docs/security` - Security Guidelines
- `/docs/ui` - UI Specification
- `/docs/hipaa` - HIPAA Compliance
- `/docs/deployment` - Deployment Guide
- `/docs/workflow` - Replit Workflow
