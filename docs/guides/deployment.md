# Deployment Guide

Deployment procedures for StadiumOS AI across all target environments.

---

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
3. [Cloud Run Deployment (Backend)](#cloud-run-deployment-backend)
4. [Linux VM Deployment](#linux-vm-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment-future-ready)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## Docker Deployment

### Prerequisites

- Docker 24+
- Docker Compose 2+

### Development

```bash
# Start full stack
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Full rebuild
docker compose up -d --build
```

### Production

```bash
# Build with production profile
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale backend
docker compose up -d --scale backend=3

# Update single service
docker compose up -d --no-deps backend
```

### Docker Image Details

**Frontend** (`node:20-alpine`):
- Port: 3000
- Health: N/A (static/CDN served)
- User: nextjs (uid 1001)

**Backend** (`python:3.12-slim`):
- Port: 8000
- Health: GET /health
- User: stadiumos (uid 1000)
- Workers: 4 (production)

---

## Vercel Deployment (Frontend)

### Setup

1. Connect GitHub repository to Vercel
2. Configure framework preset: Next.js
3. Set environment variables in Vercel dashboard:

```bash
NEXT_PUBLIC_APP_URL=https://app.stadiumos.ai
NEXT_PUBLIC_API_URL=https://api.stadiumos.ai
AUTH_SECRET=@auth-secret
```

### Build Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `cd frontend && pnpm build` |
| Output Directory | `frontend/.next` |
| Install Command | `cd frontend && pnpm install` |
| Node Version | 20.x |

### Environment Configuration

```bash
# Vercel Dashboard → Project Settings → Environment Variables
# Production:
NEXT_PUBLIC_APP_URL=https://app.stadiumos.ai
NEXT_PUBLIC_API_URL=https://api.stadiumos.ai
NEXT_PUBLIC_ENABLE_COPILOT=true

# Preview (auto-populated):
NEXT_PUBLIC_APP_URL=https://${VERCEL_URL}
```

### Rollback

```bash
# Vercel Dashboard → Deployments → ⋯ → Promote to Production
# Or use Vercel CLI:
vercel rollback
```

---

## Cloud Run Deployment (Backend)

### Setup

```bash
# Authenticate
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/stadiumos/backend:latest ./backend
docker push gcr.io/stadiumos/backend:latest

# Deploy
gcloud run deploy stadiumos-api \
  --image gcr.io/stadiumos/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 80 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars "DATABASE_URL=..." \
  --set-env-vars "REDIS_URL=..." \
  --set-secrets "AUTH_SECRET=auth-secret:latest"
```

### Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| Min instances | 1 | Prevents cold starts |
| Max instances | 10 | Auto-scales under load |
| Concurrency | 80 | Requests per instance |
| Memory | 512Mi | Sufficient for AI calls |
| CPU | 1 | 1 vCPU |
| Timeout | 300s | AI generation may take time |
| Port | 8000 | FastAPI default |

### Rollback

```bash
# List revisions
gcloud run revisions list --service stadiumos-api

# Rollback to specific revision
gcloud run services update-traffic stadiumos-api \
  --to-revisions stadiumos-api-00005=100
```

---

## Linux VM Deployment

### Prerequisites

- Ubuntu 22.04+ or Debian 12+
- Node.js 20+, Python 3.12+, PostgreSQL 16, Redis 7
- Nginx or Caddy (reverse proxy)

### Setup Script

```bash
#!/bin/bash
# deploy-linux.sh

# 1. Install dependencies
apt update
apt install -y nginx postgresql redis

# 2. Clone and build
git clone https://github.com/your-org/stadiumos-ai.git /opt/stadiumos
cd /opt/stadiumos/frontend
pnpm install
pnpm build

# 3. Configure backend
cd /opt/stadiumos/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4. Configure Nginx
cat > /etc/nginx/sites-available/stadiumos << 'EOF'
server {
    listen 80;
    server_name app.stadiumos.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 5. Start services
systemctl enable --now postgresql redis
systemctl enable --now nginx

# 6. Start application (use systemd or supervisor)
cd /opt/stadiumos/frontend
NODE_ENV=production pnpm start &

cd /opt/stadiumos/backend
source .venv/bin/activate
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000 &
```

---

## Kubernetes Deployment (Future-Ready)

### Directory Structure

```
infra/k8s/
├── namespace.yaml
├── configmap.yaml
├── secrets.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── backend-deployment.yaml
├── backend-service.yaml
├── postgres-statefulset.yaml
├── postgres-service.yaml
├── redis-deployment.yaml
├── redis-service.yaml
├── ingress.yaml
└── hpa.yaml
```

### Key Configuration

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stadiumos-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stadiumos-backend
  template:
    spec:
      containers:
      - name: backend
        image: gcr.io/stadiumos/backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: stadiumos-config
        - secretRef:
            name: stadiumos-secrets
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
```

### HPA Configuration

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: stadiumos-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: stadiumos-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The CI pipeline (`.github/workflows/ci.yml`) runs on every push to `main` and every PR:

**Job 1: Frontend Checks**
```
pnpm install
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
```

**Job 2: Backend Checks**
```
pip install -r requirements-dev.txt
ruff check .
mypy app/
pytest --cov --cov-report=term-missing
bandit -r app/
```

**Job 3: Security Audit**
```
npm audit --audit-level=high
safety check
```

### Quality Gate Pipeline

The quality gate pipeline (`.github/workflows/quality-gates.yml`) runs in parallel:

1. `lint` — ESLint + Prettier check
2. `unit-tests` — All unit tests
3. `integration-tests` — Cross-module tests
4. `security-tests` — RBAC, auth, injection tests
5. `accessibility-tests` — WCAG audit tests
6. `performance-tests` — Benchmark assertions
7. `api-tests` — API contract tests
8. `ai-validation-tests` — AI response quality tests
9. `e2e-tests` — Playwright user journeys
10. `error-handling-tests` — Failure mode tests
11. `coverage-report` — Coverage threshold check
12. `quality-gate` — Aggregator (pass/fail summary)
