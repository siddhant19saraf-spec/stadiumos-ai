# Log Investigation Runbook

## Purpose
This runbook describes how to access, search, and analyze application logs across the StadiumOS AI platform — frontend (browser + server logs), backend (FastAPI/uvicorn), database (PostgreSQL), and infrastructure — to diagnose issues.

---

## 1. Logging Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser     │────>│  Sentry      │     │  Cloud       │
│  Console     │     │  (Errors)    │     │  Logging     │
└─────────────┘     └──────────────┘     └──────────────┘
                                                    │
┌─────────────┐     ┌──────────────┐               │
│  Backend     │────>│  stdout      │───────────────┘
│  (uvicorn)   │     │  (JSON)      │
└─────────────┘     └──────────────┘
                                                    │
┌─────────────┐     ┌──────────────┐               │
│  PostgreSQL  │────>│  CSV log     │───────────────┘
│  (slow query)│     │  (file)      │
└─────────────┘     └──────────────┘
```

All backend logs are emitted as **structured JSON** to stdout, which is captured by Cloud Logging (Cloud Run) or Docker Compose logs. Frontend errors are captured by Sentry.

---

## 2. Backend Logs (FastAPI / Uvicorn)

### 2.1 Local Development
```powershell
# Server logs are printed to the terminal where uvicorn is running
# Example output:
# INFO:     127.0.0.1:54321 - "GET /api/v1/venues HTTP/1.1" 200 OK
# WARNING:  Slow endpoint: GET /api/v1/events (took 2.3s)
# ERROR:    Database connection failed: timeout

# To tail logs to a file
uvicorn app.main:app --reload > app.log 2>&1
```

### 2.2 Production (Cloud Run / Cloud Logging)
```powershell
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=stadiumos-api" --limit 50 --freshness=1h

# View only errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 50 --freshness=1h

# View logs for a specific request (trace ID)
gcloud logging read "jsonPayload.trace_id=abc123def456"

# Tail live logs
gcloud logging read "resource.type=cloud_run_revision" --limit 10 --freshness=5m --format=json
```

### 2.3 Docker Compose (Self-Hosted)
```powershell
# Tail all services
docker compose logs -f

# Tail a specific service
docker compose logs -f stadiumos-api

# Tail with timestamps
docker compose logs -f -t stadiumos-api

# Last 100 lines
docker compose logs --tail=100 stadiumos-api

# Search within logs
docker compose logs stadiumos-api | Select-String -Pattern "ERROR"
```

### 2.4 Structured JSON Log Format
Backend logs follow this structure:

```json
{
  "timestamp": "2026-07-18T12:00:00.000Z",
  "level": "INFO",
  "logger": "app.api.v1.venues",
  "message": "Fetching venues list",
  "trace_id": "abc123def456",
  "user_id": 42,
  "request_id": "req_789xyz",
  "duration_ms": 45.2,
  "path": "/api/v1/venues",
  "method": "GET",
  "status_code": 200,
  "metadata": {
    "page": 1,
    "per_page": 20
  }
}
```

---

## 3. Logger Class Usage

The StadiumOS platform uses a structured `Logger` class defined in `apps/api/app/core/logger.py`.

### 3.1 Basic Usage
```python
from app.core.logger import get_logger

logger = get_logger(__name__)

logger.info("Fetching venues list", page=1, per_page=20)
logger.warning("Slow query detected", duration_ms=2450, query="SELECT ...")
logger.error("Database connection failed", exc_info=True)
```

### 3.2 Logger API
| Method | Level | When to use |
|--------|-------|-------------|
| `logger.debug()` | DEBUG | Detailed diagnostic info (development only) |
| `logger.info()` | INFO | Normal operational events (request start/end, state changes) |
| `logger.warning()` | WARNING | Something unexpected but not an error (slow query, rate limit near) |
| `logger.error()` | ERROR | A failure that affects the current operation |
| `logger.critical()` | CRITICAL | A failure that requires immediate attention (DB down, disk full) |

### 3.3 Standard Log Fields
Always include these fields when logging in request context:
```python
logger.info(
    "Order created",
    order_id=order.id,
    user_id=request.user.id,
    trace_id=request.state.trace_id,
    duration_ms=elapsed,
)
```

---

## 4. Frontend Logs

### 4.1 Browser Console Logs
- Open DevTools (F12) → Console tab
- Filter by level (Info, Warning, Error)
- Look for network errors, unhandled rejections, React render errors

### 4.2 Frontend Server-Side Logs (Next.js)
```powershell
# Next.js server logs in development
# LRU cache, API route logs, middleware logs

# Production (Vercel)
# Logs are available in Vercel Dashboard:
# https://vercel.com/stadiumos/stadiumos-web/logs
```

### 4.3 Vercel Logs via CLI
```powershell
# View recent deployment logs
npx vercel logs

# View logs for specific deployment
npx vercel logs <deployment-url>
```

### 4.4 Common Frontend Error Patterns
| Error | Likely Cause | Investigation |
|-------|-------------|---------------|
| `TypeError: Cannot read properties of undefined` | Null/undefined state | Check API response shape, default values |
| `NetworkError` | API unreachable | Check CORS, API URL, network tab |
| `ChunkLoadError` | Deploy mismatch | Hard refresh, clear service worker |
| `Minified React error #XXX` | React runtime error | Check Sentry for full stack trace |
| `401 Unauthorized` | Expired token | Check auth flow, token refresh logic |

---

## 5. Database Logs (PostgreSQL)

### 5.1 Enable Query Logging (Development)
```powershell
# Set in postgresql.conf or via docker env
# log_statement = 'all'
# log_min_duration_statement = 200  # log queries > 200ms
```

### 5.2 Docker PostgreSQL Logs
```powershell
docker compose logs stadiumos-postgres

# Find slow queries
docker compose logs stadiumos-postgres | Select-String -Pattern "duration"
```

### 5.3 Cloud SQL / Production PostgreSQL
```powershell
# View database logs via Cloud Logging
gcloud logging read "resource.type=cloudsql_database AND log_name=postgres.log" --limit 50
```

### 5.4 Manual Query Analysis
```powershell
# Connect to database
psql -h $DB_HOST -U $DB_USER -d stadiumos

# View current running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration,
       query, state
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

# Find slow queries from pg_stat_statements
SELECT query, total_exec_time, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

# Check for locks
SELECT relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted;
```

---

## 6. Redis Logs

```powershell
# Docker
docker compose logs stadiumos-redis

# Monitor Redis commands (live)
redis-cli -h localhost monitor
```

---

## 7. Structured Logging Search Patterns

### 7.1 Find All Requests for a Specific Route
```powershell
gcloud logging read 'jsonPayload.path="/api/v1/checkout"' --limit 100
```

### 7.2 Find Requests with Error Status
```powershell
gcloud logging read 'jsonPayload.status_code>=500' --limit 100
```

### 7.3 Find Slow Requests
```powershell
gcloud logging read 'jsonPayload.duration_ms>1000' --limit 50
```

### 7.4 Find Logs for a Specific User
```powershell
gcloud logging read 'jsonPayload.user_id=42' --limit 50
```

### 7.5 Find Logs by Trace ID
```powershell
gcloud logging read 'jsonPayload.trace_id="abc123def456"'
```

---

## 8. Sentry Investigation

1. Go to [Sentry Dashboard](https://sentry.io/organizations/stadiumos/)
2. Check **Issues** tab for unhandled errors grouped by fingerprint
3. Click an issue to see:
   - Stack trace with file/line numbers
   - Browser/OS/device info
   - User affected count
   - Event timeline
   - Breadcrumbs (actions leading to the error)
4. Check **Performance** tab for slow transactions
5. Set up **Alerts** → Slack integration for new issues

---

## 9. Log Retention & Access

| Log Source | Retention | Access |
|-----------|-----------|--------|
| Cloud Logging (Backend) | 30 days (default), 365 days (audit) | `gcloud logging read` |
| Vercel Logs (Frontend) | 7 days (Hobby), 30 days (Pro) | Vercel Dashboard / CLI |
| Sentry | 90 days (errors), 30 days (performance) | Sentry Dashboard |
| PostgreSQL Logs | 7 days | Cloud Logging / `docker logs` |
| PostgreSQL Slow Query Log | 7 days | `pg_stat_statements` query |
| Docker Compose Logs | Until container removed | `docker compose logs` |

---

## 10. Troubleshooting

| Problem | Approach |
|---------|----------|
| No logs appearing | Check `LOG_LEVEL` env var (should be INFO or DEBUG) |
| Logs are not structured JSON | Verify `app/core/logger.py` is configured for JSON format |
| Can't find a specific request | Search by `trace_id` or `request_id` |
| Frontend error not in Sentry | Check Sentry DSN is set; CORS may block reporting |
| Too many logs | Increase `LOG_LEVEL` to WARNING in production |
| Missing context fields | Check logger call includes `trace_id`, `user_id`, `duration_ms` |
