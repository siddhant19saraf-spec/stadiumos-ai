# 🏟️ StadiumOS AI

**The Autonomous Stadium Operations Platform**

> One platform. Fourteen integrated AI modules. Real-time operational intelligence for modern sports and entertainment venues.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-FF4438?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-2,000%2B-22c55e)](https://github.com/)
[![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA-005A9C)](https://www.w3.org/TR/WCAG22/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)

---

## 🎯 PromptWars Challenge 4: Smart Stadium Operations

> **Submission for PromptWars Virtual — Challenge 4: Smart Stadium Operations**
>
> Built using prompt-driven development with Google Antigravity and AI-assisted engineering.

| Submission | Status |
|------------|--------|
| **Technical** | ✅ Code + Architecture (this repository) |
| **Live Demo** | ✅ [Deployed on Vercel](#) |
| **Narrative** | ✅ [Technical Blog](BLOG.md) · [LinkedIn Post](LINKEDIN_POST.md) |
| **Documentation** | ✅ [For Judges](FOR_JUDGES.md) · [Architecture](ARCHITECTURE.md) |

### Prompt Strategy Summary

This entire platform was built using **prompt-driven development** — every module, component, and test was generated with AI assistance and refined with human judgment:

1. **Architecture prompts** → Feature-sliced architecture with 10 ADRs
2. **Component prompts** → 100+ accessible React components (WCAG 2.2 AA)
3. **Backend prompts** → FastAPI async-native services with 8 specialized engines
4. **AI prompts** → Multi-provider abstraction with automatic failover
5. **DevOps prompts** → 5 CI/CD workflows, Docker multi-stage, K8s manifests
6. **Testing prompts** → 2,000+ tests across all modules

**Key insight**: Prompt engineering IS architecture. Clear, specific prompts with context produce production-grade code.

---

## Why StadiumOS AI?

Modern stadiums run on **15+ disconnected systems** — crowd monitoring, parking, emergency response, maintenance, concessions, energy. Operators juggle separate dashboards. Critical insights are missed. Response times suffer.

**StadiumOS AI unifies everything.** One platform, one command center, one AI copilot — connecting every operational domain through real-time intelligence, predictive analytics, and automated decision support.

---

## What Judges See First

```
┌────────────────────────────────────────────────────────────────┐
│                    🏟️ STADIUMOS AI                              │
│         Command Center · AI Copilot · Digital Twin               │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  COMMAND │ │    AI    │ │  DIGITAL │ │  14 INTEGRATED    │  │
│  │  CENTER  │ │  COPILOT │ │   TWIN   │ │    MODULES        │  │
│  │  LIVE KPI │ │  CHAT    │ │  3D VENUE│ │                   │  │
│  │  AI REQS  │ │  REASON  │ │ TIME-    │ │  Crowd · Parking  │  │
│  │  CHARTS   │ │  PREDICT │ │ TRAVEL   │ │  Emergency · Q    │  │
│  └──────────┘ └──────────┘ └──────────┘ │  Maintenance · E   │  │
│                                          │  Tournament · ...  │  │
│  ┌─────────────────────────────────────┐ └──────────────────┘  │
│  │  TypeScript Strict · React 19 · RSC │                        │
│  │  FastAPI · asyncpg · Redis · Docker │                        │
│  │  Prometheus · Grafana · K8s-ready   │                        │
│  └─────────────────────────────────────┘                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Judge's 30-Second Assessment

| Category | What We Built |
|----------|---------------|
| **Scope** | 14 integrated operational modules — crowd, parking, queue, emergency, maintenance, energy, security, tournament, digital twin, AI copilot, executive analytics, accessibility, performance, QA |
| **AI** | Multi-provider AI abstraction (OpenAI GPT-4 + Gemini + Mock) with automatic failover. AI Copilot with conversation, reasoning, and explainability |
| **Architecture** | Feature-sliced design with 10 ADRs. Next.js 16 App Router + FastAPI async + PostgreSQL 16 + Redis 7. Event-driven via pub/sub |
| **DevOps** | 5 GitHub Actions workflows (CI, deploy, security, performance, release). Docker multi-stage. K8s manifests. Signed images. SBOM generation |
| **Observability** | Prometheus (35+ metrics, 18 alert rules). Grafana (17-panel ops center). Loki logs. Tempo traces. Correlation IDs |
| **Accessibility** | WCAG 2.2 AA. 25 criteria tracked. SkipLink, Announcer, Focus Manager, Keyboard nav, Reduced motion |
| **Quality** | 2,000+ test suite. Quality gates block deployment. 80% coverage floor. pnpm audit + Safety + Trivy + CodeQL + TruffleHog + Semgrep |

---

## 🏆 Technical Highlights

### Frontend: Next.js 16 + React 19 + TypeScript Strict
- **App Router** with RSC/RCC split for optimal rendering
- **React Query** for server state (30s stale time, optimistic updates)
- **Zustand** for lightweight client state
- **TanStack Virtual** for 10-row windowed rendering
- **Performance utilities**: memoize, debounce, throttle, rafThrottle, lazyComponent
- **Accessibility infrastructure**: SkipLink, AnnouncerProvider, FocusManager, keyboard-nav, motion detection
- **Security headers**: CSP, HSTS, X-Frame-Options, Permissions-Policy
- **Code splitting**: `optimizePackageImports` for lucide-react, recharts

### Backend: FastAPI + Python 3.12 + Async-native
- **SQLAlchemy 2.0 async** with connection pooling (20 pool / 10 overflow)
- **Multi-provider AI gateway** — OpenAI + Gemini + Mock with automatic failover
- **ARQ task queue** for background processing
- **35+ Prometheus metrics** auto-instrumented via middleware
- **Correlation ID tracing** through entire request lifecycle
- **Structured logging** with JSON format
- **Health / Readiness / Liveness** endpoints with dependency checks
- **Production config validation** — warns on default secrets

### Infrastructure: Production-Grade DevOps
- **Docker**: 4-stage frontend build (deps → builder → dev → prod), 3-stage backend. Non-root users. Health checks. `.dockerignore`
- **Docker Compose**: Production (5 services), dev overrides, monitoring stack (6 services)
- **CI/CD**: 5 workflows — CI (10 parallel jobs), deploy (signed + SBOM + staging + prod), security (8 tools), performance (k6 + Lighthouse), release (standard + hotfix)
- **Kubernetes**: Base manifests with liveness/readiness/startup probes, resource limits, Kustomize overlays for staging/production
- **Monitoring**: Prometheus (18 alert rules, 3 severity levels), Grafana (auto-provisioned dashboards), Loki (structured logs), Tempo (OTLP traces)

---

## 🚀 One-Command Demo

```bash
# Full stack with monitoring — one command
docker compose -f infra/compose/docker-compose.yml \
               -f infra/compose/docker-compose.monitoring.yml \
               up -d

# Open in browser
open http://localhost:3000    # Frontend
open http://localhost:3001    # Grafana (admin/stadiumos)
open http://localhost:9090    # Prometheus
```

**No API keys required.** The platform works fully with mock AI providers. Add `OPENAI_API_KEY` or `GEMINI_API_KEY` for real AI.

---

## 🧭 Module Tour

### Command Center
Real-time operational hub. KPI cards across all domains. AI executive summary. Live charts for attendance, crowd density, parking, queues, energy, revenue. Incident table with one-click view. Activity feed. Refresh button with loading state.

### AI Copilot
Conversational operations assistant. Multi-turn chat with context awareness. Explainable AI — shows reasoning, confidence, alternatives. Operational summary cards. Active risk monitoring. Predicted problem detection. Decision comparison. Action execution with confirmation.

### Digital Twin
3D venue visualization. Layer controls (crowd heat, parking, emergency zones, power grid). Time travel slider for historical replay. Simulation controls for what-if analysis. Zone detail panels. AI insight overlay.

### Crowd Intelligence
Real-time zone monitoring with heat map. Density prediction. Queue growth modeling. Risk assessment. Gate utilization. AI recommendations for flow optimization.

### Emergency Response
Incident detection and tracking. AI-powered analysis and dispatch. Response team management. Priority queue. Critical alerts. Multi-agency coordination. Timeline tracking.

### Executive Analytics
Role-based dashboards (CEO, COO, Security Director, Tournament Director, Sustainability Officer, Operations Manager). Cross-module KPI aggregation. AI-generated recommendations. Risk assessment. Trend analysis. Automated reporting.

### Predictive Maintenance
Asset health grid with status indicators. Failure prediction with probability scoring. Risk matrix. Simulation panel for maintenance scenarios. Work order tracking. Zone health map.

### Smart Parking + Queue Intelligence
Real-time occupancy. Reservation management. Traffic integration. Prediction panels. Simulation controls. Staff optimization. Concession inventory.

### Tournament Operations
End-to-end event scheduling. Match card views. Conflict detection. Resource utilization. Operational timeline. Predictive insights. Venue readiness tracking.

### Sustainability + Energy
Domain-level monitoring (Energy, Water, Waste, Carbon). AI recommendations. Scenario simulation. KPI cards with trends.

---

## 📐 Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js 16 | SSR/SSG/ISR, App Router, React Server Components, Vercel ecosystem |
| Backend Framework | FastAPI | Async-native, Pydantic validation, OpenAPI docs, Python AI ecosystem |
| Architecture Pattern | Feature-Sliced | Module isolation, shared core, clear dependency direction |
| Server State | TanStack React Query | Caching, background refetch, optimistic updates, devtools |
| Client State | Zustand | Minimal boilerplate, no providers, TypeScript-first |
| AI Gateway | Multi-Provider | Failover, provider swapping without code changes, mock for dev |
| Auth | JWT + Refresh | Stateless auth, 15-min tokens, 7-day refresh, rotation |
| Type Safety | TypeScript Strict | `strict: true`, no implicit any, exactOptionalPropertyTypes |

See all [10 Architecture Decision Records](docs/adrs/) for detailed rationale.

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Source files | 318 (excluding dependencies) |
| Frontend components | 100+ across 14 feature modules |
| Backend services | 29 Python modules, 8 service engines |
| Docker images | 2 (frontend ~150MB, backend ~200MB) |
| CI/CD workflows | 5 (CI, deploy, security, performance, release) |
| Prometheus metrics | 35+ custom across API, AI, DB, queue, auth |
| Alert rules | 18 across 6 severity groups |
| Documentation | 30+ documents, 10 ADRs, 8 runbooks |
| Test infrastructure | Vitest + pytest + Playwright + k6 + Lighthouse |
| Quality gates | 8 blocking (tests, coverage, types, lint, security, E2E, integration, perf) |

---

## 📚 Documentation

| Category | Links |
|----------|-------|
| **For Judges** | [Quick Start](FOR_JUDGES.md) — 60-second overview |
| **Architecture** | [System Design](docs/architecture/) · [10 ADRs](docs/adrs/) |
| **Deployment** | [Docker Guide](docs/ops/docker-guide.md) · [Deployment Guide](docs/ops/deployment-guide.md) · [CI/CD Guide](docs/ops/ci-cd-guide.md) |
| **Operations** | [Manual](docs/ops/operations-manual.md) · [Monitoring](docs/ops/monitoring-guide.md) · [Incident Response](docs/ops/incident-response-guide.md) |
| **Security** | [Policy](SECURITY.md) · [Security Guide](docs/ops/security-guide.md) |
| **Quality** | [Report](docs/quality-report.md) · [Test Plan](docs/test-plan.md) · [Production Readiness](PRODUCTION_READINESS.md) · [Final Review](FINAL_REVIEW.md) |

---

## 🛠️ Development Quick Start

```bash
# Prerequisites: Node.js 20+, Python 3.12+, Docker

# 1. Infrastructure
docker compose up -d db redis

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
pnpm install
pnpm dev

# 4. Open http://localhost:3000
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | Optional | — | GPT-4 Turbo for AI Copilot |
| `GEMINI_API_KEY` | Optional | — | Gemini 1.5 Pro (fallback) |
| `AI_PROVIDER_PRIMARY` | No | `mock` | `mock` / `openai` / `gemini` |
| `DATABASE_URL` | Yes | PostgreSQL on localhost | Async database connection |
| `REDIS_URL` | Yes | Redis on localhost | Cache + queue + event bus |
| `AUTH_SECRET` | Yes | Dev placeholder | JWT signing (change for prod) |

Full reference in [`.env.example`](.env.example) and [Configuration Guide](docs/guides/configuration.md).

---

## 🧪 Testing

```bash
# Frontend
cd frontend && pnpm test              # Unit + component tests
cd frontend && pnpm test:coverage     # With coverage report
cd frontend && pnpm test:e2e          # Playwright E2E tests

# Backend
cd backend && pytest --cov=app --cov-report=term  # Unit + integration

# Infrastructure
bash infra/scripts/test-infra.sh                  # 30 infrastructure checks

# Load testing
k6 run infra/k6/load-test.js                     # Graduated load test
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, commit conventions, and PR process.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Built With

[Next.js](https://nextjs.org/) · [FastAPI](https://fastapi.tiangolo.com/) · [Tailwind CSS](https://tailwindcss.com/) · [Radix UI](https://www.radix-ui.com/) · [TanStack](https://tanstack.com/) · [Recharts](https://recharts.org/) · [Lucide](https://lucide.dev/) · [Zustand](https://github.com/pmndrs/zustand) · [OpenAI](https://openai.com/) · [Google AI](https://ai.google/)
