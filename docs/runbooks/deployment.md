# Deployment Runbook

## Purpose
This runbook describes how to deploy the StadiumOS AI platform — frontend to Vercel, backend to Google Cloud Run, and full stack via Docker Compose. Includes pre-deployment checklist, deployment commands, post-deployment verification, and rollback strategy.

---

## 1. Pre-Deployment Checklist

Before any production deployment, verify all items below:

### 1.1 Code Quality
- [ ] PR approved by at least one reviewer
- [ ] All CI checks pass (lint, type-check, tests)
- [ ] `npm run lint` passes (frontend)
- [ ] `ruff check apps/api` passes (backend)
- [ ] `mypy apps/api` passes (type checks)
- [ ] No `FIXME`, `TODO`, or `console.log` committed (unless intentional)

### 1.2 Tests
- [ ] Frontend: `npm run test` passes
- [ ] Backend: `pytest apps/api/tests` passes
- [ ] Integration tests pass (if applicable)
- [ ] E2E tests pass (if applicable)

### 1.3 Environment & Configuration
- [ ] All required environment variables are set in production
- [ ] `DATABASE_URL` points to production database
- [ ] `REDIS_URL` points to production Redis
- [ ] `NEXT_PUBLIC_API_URL` points to production backend URL
- [ ] `BACKEND_CORS_ORIGINS` includes frontend production domain
- [ ] `SECRET_KEY` rotated (if security-sensitive change)
- [ ] Feature flags are configured correctly

### 1.4 Database
- [ ] Alembic migration script is reviewed and tested
- [ ] Migration is reversible (has `downgrade()`)
- [ ] No destructive data changes without review
- [ ] Database backup taken before deployment

### 1.5 Infrastructure
- [ ] Cloud Run / Vercel quotas are not exceeded
- [ ] No ongoing incidents or maintenance windows
- [ ] CI/CD pipeline is green

---

## 2. Backend Deployment (Google Cloud Run)

### 2.1 Build and Push Container
```powershell
# Set project
gcloud config set project stadiumos-prod

# Build container image
gcloud builds submit apps/api `
  --tag gcr.io/stadiumos-prod/stadiumos-api:$BUILD_TAG
```

### 2.2 Deploy to Cloud Run
```powershell
gcloud run deploy stadiumos-api `
  --image gcr.io/stadiumos-prod/stadiumos-api:$BUILD_TAG `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --min-instances 1 `
  --max-instances 10 `
  --concurrency 80 `
  --cpu 2 `
  --memory 1Gi `
  --timeout 300 `
  --set-env-vars "^--^DATABASE_URL=$DATABASE_URL--^REDIS_URL=$REDIS_URL--^SECRET_KEY=$SECRET_KEY--^ENVIRONMENT=production"
```

### 2.3 Verify Backend Deployment
```powershell
# Check Cloud Run revision status
gcloud run revisions list --service stadiumos-api --region us-central1

# Test health endpoint
curl https://stadiumos-api-xyz-uc.a.run.app/api/v1/health

# Check logs for errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=stadiumos-api AND severity>=ERROR" --limit 20
```

---

## 3. Frontend Deployment (Vercel)

### 3.1 Deploy via CLI
```powershell
# From apps/web directory
npx vercel --prod

# Or deploy a specific branch
npx vercel --prod --branch=main
```

### 3.2 Deploy via Git (Automatic)
Vercel is connected to the GitHub repository. Pushing to `main` triggers an automatic production deployment.

### 3.3 Set Environment Variables (Vercel Dashboard)
- `NEXT_PUBLIC_API_URL` — production API URL
- `NEXT_PUBLIC_WS_URL` — WebSocket URL
- `SENTRY_DSN` — error tracking
- `NEXT_PUBLIC_GA_ID` — analytics

### 3.4 Verify Frontend Deployment
```powershell
# Check Vercel deployment status
npx vercel list

# Open the production URL
curl https://stadiumos.ai/api/health

# Check Lighthouse scores (target: >90 all categories)
npx lighthouse https://stadiumos.ai --output=json --quiet
```

---

## 4. Database Migrations (Production)

```powershell
# Run via Cloud Run job (execute once)
gcloud run jobs execute stadiumos-db-migrate --region us-central1

# Or run manually with production connection string
alembic upgrade head
```

---

## 5. Docker Compose Deployment (Full Stack)

For self-hosted or staging environments using Docker Compose:

### 5.1 Deploy
```powershell
# Pull latest images
docker compose pull

# Start services
docker compose up -d

# Check status
docker compose ps
```

### 5.2 Verify
```powershell
docker compose logs --tail=50 stadiumos-api
curl http://localhost:8000/api/v1/health
curl http://localhost:3000
```

---

## 6. Post-Deployment Verification

### 6.1 Smoke Tests
- [ ] Health endpoint returns 200
- [ ] Database connection is healthy
- [ ] Redis connection is healthy
- [ ] Login flow works
- [ ] Core user flow works (e.g., create event, view venue)
- [ ] No 4xx/5xx errors in logs

### 6.2 Monitoring Check
- [ ] Sentry shows no new errors
- [ ] Grafana dashboard shows normal metrics
- [ ] Cloud Monitoring alerts are not firing
- [ ] API response times within baseline (p95 < 500ms)

### 6.3 Feature Validation
- [ ] New feature works as expected
- [ ] Feature flags are toggled to correct state
- [ ] No regression in existing functionality

---

## 7. Rollback Strategy

Refer to `rollback.md` for detailed rollback procedures.

| Component | Rollback Method | Time |
|-----------|----------------|------|
| Frontend (Vercel) | Instant rollback to previous deployment | < 1 min |
| Backend (Cloud Run) | Rollback to previous revision | < 2 min |
| Database | Alembic downgrade | Variable |
| Docker Compose | Redeploy previous image tag | < 5 min |

---

## 8. Deployment Timeline

```
1. Pre-deployment checklist  ─── 15 min
2. Database migration (if any) ─── 5 min
3. Backend deployment (Cloud Run) ─── 5 min
4. Frontend deployment (Vercel) ─── 3 min
5. Post-deployment verification ─── 15 min
6. Monitoring period ─── 30 min
Total: ~73 min (without migration: ~53 min)
```
