# Application Startup Runbook

## Purpose
This runbook covers how to start the entire StadiumOS AI platform — frontend (Next.js 16), backend (FastAPI/Python), PostgreSQL database, and Redis cache — across three environments: local development (manual), local full stack (Docker Compose), and production.

---

## 1. Prerequisites

| Component | Version | Check Command |
|-----------|---------|---------------|
| Node.js | >= 20.x | `node --version` |
| Python | >= 3.12 | `python --version` |
| PostgreSQL | >= 16 | `psql --version` |
| Redis | >= 7 | `redis-cli --version` |
| Docker & Docker Compose | Latest | `docker compose version` |
| Vercel CLI | Latest | `npx vercel --version` |
| Google Cloud SDK | Latest | `gcloud --version` |

Environment variables must be present in:
- `apps/web/.env.local` (frontend)
- `apps/api/.env` (backend)
- `docker-compose.yml` (or a `.env` file at project root)

---

## 2. Local Development — Manual Start

### 2.1 Start PostgreSQL
```powershell
# Using Docker for local dev DB
docker run -d --name stadiumos-db `
  -e POSTGRES_USER=stadiumos `
  -e POSTGRES_PASSWORD=stadiumos_dev `
  -e POSTGRES_DB=stadiumos `
  -p 5432:5432 `
  postgres:16-alpine
```

### 2.2 Start Redis
```powershell
docker run -d --name stadiumos-redis -p 6379:6379 redis:7-alpine
```

### 2.3 Start Backend (FastAPI)
```powershell
# Navigate to backend
cd apps/api

# Create/activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations
alembic upgrade head

# Start uvicorn dev server with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2.4 Start Frontend (Next.js 16)
```powershell
# Navigate to frontend
cd apps/web

# Install dependencies
npm install

# Start dev server
npm run dev
# Starts on http://localhost:3000
```

### 2.5 Start Celery Worker (async tasks)
```powershell
# In a separate terminal, from apps/api
celery -A app.core.celery_app worker --loglevel=info
```

---

## 3. Docker Compose — Full Stack (Local)

```powershell
# From project root
docker compose up -d
```

This starts:
- `stadiumos-postgres` — PostgreSQL 16 on port 5432
- `stadiumos-redis` — Redis 7 on port 6379
- `stadiumos-api` — FastAPI backend on port 8000
- `stadiumos-web` — Next.js frontend on port 3000
- `stadiumos-celery` — Celery worker (async task processing)
- `stadiumos-nginx` — Reverse proxy on port 80

### Stop full stack
```powershell
docker compose down
# Add -v to destroy volumes (removes DB data):
docker compose down -v
```

### Rebuild images and start
```powershell
docker compose up -d --build
```

---

## 4. Production Startup

### 4.1 Backend (Google Cloud Run)
```powershell
# Build and push container
gcloud builds submit apps/api --tag gcr.io/$PROJECT_ID/stadiumos-api:latest

# Deploy revision
gcloud run deploy stadiumos-api `
  --image gcr.io/$PROJECT_ID/stadiumos-api:latest `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars "DATABASE_URL=...,REDIS_URL=..."
```

### 4.2 Frontend (Vercel)
```powershell
# Deploy to production
npx vercel --prod

# Or via CI — Vercel automatically deploys on push to main
```

### 4.3 Database Migrations (Production)
```powershell
# Run via Cloud Run job or local with prod connection string
alembic upgrade head
```

---

## 5. Health Verification

### 5.1 Backend Health Endpoint
```powershell
curl http://localhost:8000/api/v1/health
```
Expected response (200):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-07-18T12:00:00Z"
}
```

### 5.2 Frontend Health
- Navigate to `http://localhost:3000` — page should load without errors
- Open browser DevTools (F12) → Console tab: no critical errors
- Check Network tab: API calls return 200

### 5.3 Database Connectivity
```powershell
psql -h localhost -U stadiumos -d stadiumos -c "SELECT 1;"
```

### 5.4 Redis Connectivity
```powershell
redis-cli -h localhost ping
# Should return: PONG
```

### 5.5 Docker Compose Health
```powershell
docker compose ps
# All services should show "Up" or "Healthy"
docker compose logs --tail=50 stadiumos-api
# No startup errors
```

### 5.6 Full Integration Check
```powershell
# Test API can query DB
curl http://localhost:8000/api/v1/health/db

# Test Redis cache is working
curl http://localhost:8000/api/v1/health/cache

# Test a core business endpoint
curl http://localhost:8000/api/v1/venues

# Test frontend can reach API
curl http://localhost:3000/api/health
```

---

## 6. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Backend won't start, port in use | Port 8000 already bound | `netstat -ano \| findstr :8000` then kill process or change port |
| DB connection refused | PostgreSQL not running | `docker ps \| findstr postgres`; start container |
| Redis connection error | Redis not running | `docker ps \| findstr redis`; start container |
| Migration fails | Alembic versions table mismatch | Run `alembic stamp head` then retry `alembic upgrade head` |
| Frontend build errors | Dependency mismatch | Delete `node_modules` and `.next`, re-run `npm install` |
| CORS errors in browser | Backend origin not allowed | Check `BACKEND_CORS_ORIGINS` env; include `http://localhost:3000` |
