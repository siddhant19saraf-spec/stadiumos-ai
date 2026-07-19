# StadiumOS AI — Documentation

> Version 0.1.0 · July 2026

Welcome to the StadiumOS AI documentation. This is the central index for all platform documentation.

---

## Getting Started

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview, quick start, feature list |
| [Developer Guide](guides/developer-guide.md) | Local setup, coding standards, workflow, debugging |
| [Architecture](architecture/README.md) | System design, data flow, component architecture |
| [Configuration Guide](guides/configuration.md) | Environment variables, secrets, feature flags |

## Architecture

| Document | Description |
|----------|-------------|
| [Architecture Overview](architecture/README.md) | High-level architecture with Mermaid diagrams |
| [ADR-001: Next.js](adrs/adr-001-nextjs-frontend.md) | Why Next.js 16 |
| [ADR-002: FastAPI](adrs/adr-002-fastapi-backend.md) | Why FastAPI |
| [ADR-003: Feature Slices](adrs/adr-003-feature-sliced-architecture.md) | Why feature-sliced architecture |
| [ADR-004: React Query](adrs/adr-004-tanstack-query.md) | Why TanStack Query |
| [ADR-005: Zustand](adrs/adr-005-zustand-client-state.md) | Why Zustand |
| [ADR-006: AI Abstraction](adrs/adr-006-multi-provider-ai-abstraction.md) | Multi-provider AI design |
| [ADR-007: Mock AI](adrs/adr-007-mock-ai-providers.md) | Mock AI for development |
| [ADR-008: Digital Twin](adrs/adr-008-digital-twin-layered-architecture.md) | Digital twin architecture |
| [ADR-009: JWT Auth](adrs/adr-009-jwt-refresh-token-auth.md) | Authentication strategy |
| [ADR-010: TypeScript Strict](adrs/adr-010-typescript-strict-mode.md) | TypeScript strict mode |

## API Reference

| Document | Description |
|----------|-------------|
| [API Reference](guides/api-reference.md) | Complete API endpoint documentation |
| `GET /health` | Health check |
| `POST /auth/login` | User authentication |
| `POST /auth/refresh` | Token refresh |
| `GET /crowd/zones` | Crowd zone data |
| `GET /emergency/incidents` | Incident management |
| `GET /parking/lots` | Parking lot status |
| `GET /queue/status` | Queue status |
| `GET /maintenance/assets` | Asset data |
| `POST /ai/copilot/chat` | AI Copilot |

## Operations

| Document | Description |
|----------|-------------|
| [Operations Manual](ops/operations-manual.md) | Full operations reference, service management, DR |
| [Deployment Guide](ops/deployment-guide.md) | Docker, Vercel, Cloud Run, K8s deployment |
| [CI/CD Guide](ops/ci-cd-guide.md) | Pipeline architecture, quality gates, secrets |
| [Docker Guide](ops/docker-guide.md) | Image architecture, build commands, optimization |
| [Monitoring Guide](ops/monitoring-guide.md) | Prometheus, Grafana, Loki, Tempo, alerting |
| [Incident Response](ops/incident-response-guide.md) | Severity levels, playbooks, escalation |
| [Release Process](ops/release-process.md) | Versioning, branching, checklists, rollback |
| [Security Guide](ops/security-guide.md) | Scanning, secrets, hardening, SBOM |
| [Operations Manual (Legacy)](guides/operations.md) | Original operations documentation |
| [Runbook: Startup](runbooks/application-startup.md) | Starting the platform |
| [Runbook: Deployment](runbooks/deployment.md) | Deploying to production |
| [Runbook: Rollback](runbooks/rollback.md) | Rolling back deployments |
| [Runbook: DB Migration](runbooks/database-migration.md) | Database migration procedures |
| [Runbook: Incident Response](runbooks/incident-response.md) | Incident handling |
| [Runbook: Log Investigation](runbooks/log-investigation.md) | Log analysis |
| [Runbook: Performance](runbooks/performance-troubleshooting.md) | Performance diagnostics |
| [Runbook: Security Incident](runbooks/security-incident.md) | Security incident response |

## Development

| Document | Description |
|----------|-------------|
| [Developer Guide](guides/developer-guide.md) | Full onboarding and daily reference |
| [Project Structure](guides/project-structure.md) | Complete directory reference |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |
| [Testing Guide](../frontend/TESTING_GUIDE.md) | Testing architecture |

## Quality

| Document | Description |
|----------|-------------|
| [Quality Documentation](guides/quality.md) | Testing strategy, benchmarks, checklists |
| [Security Policy](../SECURITY.md) | Vulnerability disclosure, threat model |
| [Performance Audit](../frontend/PERFORMANCE_AUDIT.md) | Performance audit report |
| [Quality Report](quality-report.md) | Documentation quality assessment |
| [Test Plan](test-plan.md) | Testing strategy, scenarios, benchmarks |

## Deployment

| Document | Description |
|----------|-------------|
| [Deployment Guide](guides/deployment.md) | Docker, Vercel, Cloud Run, K8s |
| `docker-compose.yml` | Local infrastructure |
| `frontend/Dockerfile` | Frontend container |
| `backend/Dockerfile` | Backend container |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/quality-gates.yml` | Quality gates |

## AI

| Document | Description |
|----------|-------------|
| [AI Guide](guides/ai.md) | Recommendation engines, predictions, simulation, Copilot |
| `backend/app/ai/base.py` | AI provider interface |
| `backend/app/ai/openai_provider.py` | OpenAI integration |
| `backend/app/ai/gemini_provider.py` | Gemini integration |

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-07-18 | Initial release |

---

## Document Maintenance

**Review cycle:** All documentation reviewed quarterly or with each major release.

**Contributing to docs:** Follow the same PR process as code. Documentation-only PRs are welcome.

**Questions:** Open a GitHub Discussion or ask in the #docs channel.
