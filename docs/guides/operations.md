# Operations Manual

Reference for operating StadiumOS AI in production.

---

## Table of Contents

1. [Monitoring](#monitoring)
2. [Logging](#logging)
3. [Health Checks](#health-checks)
4. [Backups](#backups)
5. [Scaling](#scaling)
6. [Disaster Recovery](#disaster-recovery)
7. [Maintenance Procedures](#maintenance-procedures)

---

## Monitoring

### Frontend Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| LCP (Largest Contentful Paint) | Performance Monitor / Web Vitals | > 2.5s |
| INP (Interaction to Next Paint) | Performance Monitor / Web Vitals | > 200ms |
| CLS (Cumulative Layout Shift) | Performance Monitor / Web Vitals | > 0.1 |
| API response time | Performance Monitor | > 1000ms |
| Error rate | Logger + Sentry | > 1% |
| Page load time | Performance Monitor | > 3s |

### Backend Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API latency (p95) | Uvicorn + Performance Monitor | > 500ms |
| Error rate | FastAPI exception handlers | > 1% |
| Database query time | SQLAlchemy slow query log | > 200ms |
| Cache hit rate | Redis INFO | < 70% |
| Active connections | PostgreSQL pg_stat_activity | > 80% pool |
| CPU usage | Container metrics | > 80% |
| Memory usage | Container metrics | > 85% |

### Health Check Endpoints

```bash
# Frontend
GET /api/health → 200 OK

# Backend
GET /health → 200 { "status": "healthy", "uptime": 3600, "version": "0.1.0" }

# Database
SELECT 1 → 1 row

# Redis
PING → PONG
```

---

## Logging

### Log Levels

| Level | Usage | Color |
|-------|-------|-------|
| `debug` | Development diagnostics | Gray |
| `info` | General operational events | Green |
| `warn` | Unexpected but handled | Yellow |
| `error` | Failure requiring attention | Red |

### Log Format (Structured JSON)

```json
{
  "timestamp": "2026-07-18T14:30:00.000Z",
  "level": "info",
  "module": "emergency-response",
  "action": "incident.created",
  "duration_ms": 45,
  "incident_id": "inc-123",
  "correlation_id": "corr-abc-123"
}
```

### Log Locations

| Component | Location |
|-----------|----------|
| Frontend (dev) | Terminal stdout |
| Frontend (prod) | Vercel Logs / Sentry |
| Backend (dev) | Terminal stdout |
| Backend (prod) | Cloud Logging / Docker logs |
| Database | `pg_log/` inside container |
| Redis | `redis.log` inside container |

---

## Health Checks

### Automated Health Checks (Docker Compose)

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "stadiumos"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Frontend Health

The Next.js app has no built-in health endpoint (static export). Deployments verify via HTTP status check on the main page.

### Backend Health

```python
# app/main.py
@app.get("/health")
async def health():
    db_ok = await check_database()
    redis_ok = await check_redis()
    status = "healthy" if db_ok and redis_ok else "degraded"
    return {
        "status": status,
        "uptime": time.time() - start_time,
        "version": APP_VERSION,
        "checks": {
            "database": "ok" if db_ok else "failed",
            "redis": "ok" if redis_ok else "failed",
        },
    }
```

---

## Backups

### Database Backups

```bash
# Manual backup
docker compose exec db pg_dump -U stadiumos stadiumos > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (cron)
0 2 * * * docker compose exec -T db pg_dump -U stadiumos stadiumos | gzip > /backups/stadiumos_$(date +\%Y\%m\%d).sql.gz

# Restore
cat backup.sql | docker compose exec -T db psql -U stadiumos -d stadiumos
```

### Backup Policy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Daily | 30 days | Remote storage |
| Config | Per change | 90 days | Git history |
| Logs | Real-time | 30 days | Log aggregation service |
| Docker images | Per release | 10 latest | Container registry |

---

## Scaling

### Vertical Scaling

| Component | Limit | Scale Up |
|-----------|-------|----------|
| Frontend | Stateless | Increase container resources |
| Backend | CPU-bound AI calls | Increase CPU/memory |
| Database | Connection count | Increase max_connections + pool |
| Redis | Memory | Increase maxmemory |

### Horizontal Scaling

| Component | Strategy | Notes |
|-----------|----------|-------|
| Frontend | Multiple instances behind CDN | Vercel auto-scales |
| Backend | Multiple uvicorn workers → container instances | Requires session affinity for WebSocket |
| Database | Read replicas | Separate read/write connections |
| Redis | Redis Cluster | Hash slots for key distribution |
| Event Bus | Redis pub/sub across instances | All instances subscribe to same channels |

### Auto-scaling Configuration

```yaml
# docker-compose.yml (production)
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
      restart_policy:
        condition: any
```

---

## Disaster Recovery

### Recovery Point Objective (RPO)

| Data | RPO | Strategy |
|------|-----|----------|
| Database | 1 hour | WAL archiving + hourly pg_dump |
| Cache | 5 minutes | Redis RDB snapshots |
| Logs | 15 minutes | Real-time streaming |
| Configuration | Last commit | Git-based |

### Recovery Time Objective (RTO)

| Scenario | RTO | Procedure |
|----------|-----|-----------|
| Single instance failure | 30s | Docker restart policy / K8s auto-heal |
| Full frontend outage | 5min | Vercel instant rollback |
| Full backend outage | 10min | Cloud Run revision rollback |
| Database failure | 30min | Restore from backup |
| Region outage | 2hr | Multi-region deployment (future) |

### Recovery Steps

```bash
# 1. Stop affected services
docker compose stop backend

# 2. Restore database
zcat backup_latest.sql.gz | docker compose exec -T db psql -U stadiumos -d stadiumos

# 3. Restart with clean state
docker compose up -d

# 4. Verify
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## Maintenance Procedures

### Scheduled Maintenance

| Frequency | Task | Impact |
|-----------|------|--------|
| Daily | Database vacuum (auto) | None |
| Weekly | Dependency audit | None |
| Monthly | SSL certificate check | None |
| Quarterly | Load test | Off-peak hours |
| Per release | Migration + deployment | ~5min downtime |

### Zero-Downtime Deployment

1. Deploy new backend version alongside existing
2. Route new connections to new version
3. Wait for existing connections to drain
4. Remove old version
5. Deploy frontend (immutable, instant switch)

### Capacity Planning

Monitor and plan when:
- p95 API latency exceeds 500ms
- Database connection usage exceeds 70%
- Redis memory usage exceeds 75%
- Frontend build time exceeds 5 minutes
- Test suite runtime exceeds 10 minutes

### Security Maintenance

- Rotate API keys quarterly
- Review audit logs weekly
- Update dependencies monthly
- Run security scan before each release
- Review RBAC permissions quarterly
