# Running StadiumOS AI

**One-command demo for judges and evaluators.**

---

## 🚀 Quick Start (Docker)

```bash
# Full platform with monitoring — one command
docker compose -f infra/compose/docker-compose.yml \
               -f infra/compose/docker-compose.monitoring.yml \
               up -d --build
```

**No API keys required.** Mock AI providers are used by default.

---

## 📍 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | No auth required (dev mode) |
| **Grafana** | http://localhost:3001 | `admin` / `stadiumos` |
| **Prometheus** | http://localhost:9090 | — |
| **Loki** | http://localhost:3100 | — |
| **Tempo** | http://localhost:3200 | — |
| **Backend API** | http://localhost:8000/api/v1 | — |

---

## 📋 Health Check

```bash
curl -f http://localhost:8000/api/v1/health
curl -f http://localhost:3000
```

---

## 🧪 Run Tests

```bash
# Infrastructure validation
bash infra/scripts/test-infra.sh

# Frontend tests
cd frontend && pnpm test

# Backend tests
cd backend && pytest

# Load test
k6 run infra/k6/load-test.js
```

---

## 🔧 Configuration

| Variable | File | Purpose |
|----------|------|---------|
| `OPENAI_API_KEY` | `.env` | Enables real GPT-4 AI |
| `GEMINI_API_KEY` | `.env` | Enables Gemini fallback |
| `AI_PROVIDER_PRIMARY` | `.env` | `mock`, `openai`, or `gemini` |
| All env vars | `.env.example` | Full reference |

---

## 📚 Judge Documentation

| Document | Location | Read Time |
|----------|----------|-----------|
| **Judge Quick-Start** | `FOR_JUDGES.md` | 60 seconds |
| **Final Review** | `FINAL_REVIEW.md` | 10 minutes |
| **Production Readiness** | `PRODUCTION_READINESS.md` | 5 minutes |
| **Architecture Diagrams** | `docs/architecture/README.md` | 3 minutes |
| **Architecture Decisions** | `docs/adrs/` | 15 minutes |
