# VitalTrack

Real-time health monitoring for senior care facilities.

## Development Workflow

VitalTrack uses a **three-stage development approach**:

| Stage | Documentation | Description |
|-------|---------------|-------------|
| 1. Code Development | [REPLIT_WORKFLOW.md](docs/core-specs/REPLIT_WORKFLOW.md) | Use Replit Agent to build app code |
| 2. Infrastructure Setup | [DEPLOYMENT_GUIDE.md](docs/core-specs/DEPLOYMENT_GUIDE.md) | Deploy to HIPAA-compliant hosting |
| 3. HIPAA Compliance | [HIPAA_COMPLIANCE_CHECKLIST.md](docs/core-specs/HIPAA_COMPLIANCE_CHECKLIST.md) | Configure compliance settings |

### Quick Start

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Replit Agent   │ -->  │  Your Hosting    │ -->  │ HIPAA Compliance │
│  Generates Code  │      │  Infrastructure  │      │  Configuration   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

1. **Build with Replit**: Use Replit Agent to generate code per [DEVELOPMENT_PHASES.md](docs/core-specs/DEVELOPMENT_PHASES.md)
2. **Deploy**: Follow [DEPLOYMENT_GUIDE.md](docs/core-specs/DEPLOYMENT_GUIDE.md) for hosting setup
3. **Secure**: Complete [HIPAA_COMPLIANCE_CHECKLIST.md](docs/core-specs/HIPAA_COMPLIANCE_CHECKLIST.md)

## Core Specifications

All project specifications are in [docs/core-specs/](docs/core-specs/):

| Document | Purpose |
|----------|---------|
| [DEVELOPMENT_PHASES.md](docs/core-specs/DEVELOPMENT_PHASES.md) | Week-by-week build plan with [CODE]/[INFRA]/[HIPAA] tags |
| [API_SPEC.md](docs/core-specs/API_SPEC.md) | All API endpoints and data models |
| [UI_SPEC.md](docs/core-specs/UI_SPEC.md) | Complete design system |
| [SECURITY.md](docs/core-specs/SECURITY.md) | HIPAA compliance requirements |

## Archive

The full project code and additional documentation has been archived to the `archive/full-project-backup` branch.

To access the archived content:
```bash
git checkout archive/full-project-backup
```

## License

MIT
