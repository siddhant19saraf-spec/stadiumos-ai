# Performance Troubleshooting Runbook

## Purpose
This runbook provides step-by-step guidance for diagnosing and resolving performance issues across the StadiumOS AI platform — frontend (web vitals, bundle size, re-renders), backend (slow endpoints, database queries), caching (React Query, Redis), and AI provider latency.

---

## 1. Frontend Performance

### 1.1 Web Vitals Monitoring

Key metrics (target thresholds):
| Metric | Target | Description |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Perceived load speed |
| FID (First Input Delay) | < 100ms | Interactivity |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |
| INP (Interaction to Next Paint) | < 200ms | Overall responsiveness |
| TTFB (Time to First Byte) | < 800ms | Server response time |

#### Check Web Vitals in Production
```powershell
# Using Lighthouse CLI
npx lighthouse https://stadiumos.ai --output=json --quiet

# Extract key metrics
npx lighthouse https://stadiumos.ai --output=json --quiet | ConvertFrom-Json | Select-Object -ExpandProperty categories
```

### 1.2 Bundle Size Analysis

#### Check Bundle Size
```powershell
# Run bundle analysis
npm run analyze

# Or use next-bundle-analyzer (if configured)
ANALYZE=true npm run build
```

#### Find Large Dependencies
```powershell
# List top packages by size
npx cost-of-modules

# Check for duplicates
npx dpdm --tree apps/web/src/pages/index.tsx
```

#### Common Frontend Performance Issues
| Symptom | Possible Cause | Fix |
|---------|---------------|-----|
| Slow page load | Large JS bundle | Code-split with `dynamic(() => import(...))` |
| Layout shift | Missing dimensions on images | Add `width` and `height` attributes |
| Slow interactions | Unnecessary re-renders | Use `React.memo`, `useMemo`, `useCallback` |
| Janky scrolling | Heavy DOM or layout thrashing | Virtualize long lists, debounce scroll handlers |
| High TTFB | API latency or server load | Check backend, add CDN caching |
| Font flash | Large font files | Use `font-display: swap` or preload fonts |

### 1.3 React DevTools Profiling

1. Install React DevTools browser extension
2. Open DevTools → Components tab → Profiler
3. Click record, perform user action, stop recording
4. Identify:
   - Components that re-render without prop changes
   - Render duration per component
   - Commit phases

### 1.4 Network Tab Analysis

1. Open DevTools → Network tab
2. Reload the page
3. Look for:
   - **Waterfall blocking**: requests that block others
   - **Large payloads**: JSON responses > 100KB
   - **Unnecessary requests**: duplicate API calls
   - **Missing cache headers**: responses without `Cache-Control`

---

## 2. Backend Performance

### 2.1 Slow Endpoint Detection

#### Check Endpoint Latency (Production)
```powershell
# Cloud Logging — find slow requests
gcloud logging read 'jsonPayload.duration_ms>1000' --limit 20 --freshness=1h

# Show slow endpoints grouped by path
gcloud logging read 'jsonPayload.duration_ms>1000' --limit 100 --freshness=1h |
  Select-String "jsonPayload.path" | Sort-Object | Get-Unique -AsString
```

#### Manual Endpoint Testing
```powershell
# Time a request
Measure-Command { curl https://stadiumos-api-xyz-uc.a.run.app/api/v1/venues }

# Load test with a single endpoint
npx autocannon http://localhost:8000/api/v1/venues
```

### 2.2 Common Backend Performance Issues

| Symptom | Possible Cause | Investigation |
|---------|---------------|---------------|
| Endpoint slow on first request | Cold start (Cloud Run) | Set `min-instances` > 0 |
| Endpoint slow consistently | N+1 query, missing index | Check SQLAlchemy logs, `pg_stat_statements` |
| Endpoint slow intermittently | Lock contention, connection pool exhaustion | Check `pg_locks`, `pg_stat_activity` |
| Memory growing over time | Memory leak in long-running process | Check Celery tasks, connection pooling |
| High CPU | Expensive computation, unoptimized query | Profile with `cProfile` or Sentry profiling |

### 2.3 Python Profiling
```python
# Add temporary profiling for an endpoint
import cProfile
import pstats
from io import StringIO

pr = cProfile.Profile()
pr.enable()
# ... endpoint logic ...
pr.disable()

s = StringIO()
ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
ps.print_stats(20)
logger.info("Profile dump", profile=s.getvalue())
```

---

## 3. Database Query Performance

### 3.1 Identify Slow Queries
```powershell
# Connect to database
psql -h $DB_HOST -U $DB_USER -d stadiumos

# Top 10 slowest queries (requires pg_stat_statements)
SELECT query, calls, total_exec_time, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Queries that read the most rows
SELECT query, calls, rows, rows/calls AS avg_rows
FROM pg_stat_statements
ORDER BY rows DESC
LIMIT 10;
```

### 3.2 Analyze Query Plan
```powershell
# Get query plan for a slow query
EXPLAIN ANALYZE
SELECT e.*, v.name AS venue_name
FROM events e
JOIN venues v ON v.id = e.venue_id
WHERE e.start_time >= '2026-07-01'
ORDER BY e.start_time;

# Look for:
# - Seq Scan on large tables (indicates missing index)
# - Nested Loop with high row estimates
# - Sort operations using disk
```

### 3.3 Common Database Issues and Fixes

| Issue | Detection | Fix |
|-------|-----------|-----|
| Missing index | Seq Scan in query plan | `CREATE INDEX CONCURRENTLY ON events (start_time)` |
| Outdated statistics | Bad row estimates | `ANALYZE events` |
| Lock contention | `pg_locks WHERE NOT granted` | Use advisory locks, reduce transaction duration |
| Connection pool exhaustion | `Too many connections` error | Increase pool size or close idle connections |
| Bloat (dead tuples) | `pg_stat_user_tables.n_dead_tup` | `VACUUM ANALYZE events` |
| Wrong join type | Nested Loop vs Hash Join | Update statistics, set `enable_nestloop=off` temporarily |

### 3.4 Connection Pool Configuration
```python
# apps/api/app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,         # Number of persistent connections
    max_overflow=10,      # Extra connections under load
    pool_pre_ping=True,   # Verify connections before use
    pool_recycle=3600,    # Recycle connections after 1 hour
    echo=False,           # Set to True for SQL logging
)
```

---

## 4. Caching Strategy

### 4.1 Redis Cache

#### Check Redis Memory Usage
```powershell
redis-cli -h localhost INFO memory

# Check cache hit rate
redis-cli -h localhost INFO stats | Select-String "keyspace_hits|keyspace_misses"
```

#### Common Redis Issues
| Symptom | Cause | Fix |
|---------|-------|-----|
| Low cache hit ratio | TTL too short, cache not populated | Increase TTL, warm cache on startup |
| High memory usage | Cache entries too large | Reduce TTL, set `maxmemory-policy allkeys-lru` |
| Slow Redis commands | `KEYS *` or large `SMEMBERS` | Use `SCAN`, `SSCAN` instead |

#### Flush Cache (if needed)
```powershell
# Flush specific prefix
redis-cli -h localhost EVAL "return redis.call('del', unpack(redis.call('keys', ARGV[1])))" 0 "venues:*"

# Flush all (caution: clears everything)
redis-cli -h localhost FLUSHALL
```

### 4.2 React Query Cache (Frontend)

#### Verify Caching
```typescript
// In React DevTools → React Query tab
// Check:
// - staleTime (default: 0, meaning refetch on mount)
// - cacheTime (default: 5 minutes)
// - isStale, isFetching status

// Configure proper caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s before refetch
      gcTime: 5 * 60_000,    // 5 min garbage collection
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
```

---

## 5. AI Provider Latency

### 5.1 Monitor AI Calls
```python
from app.core.logger import get_logger
logger = get_logger(__name__)

# Every AI provider call should be logged with duration
logger.info(
    "AI provider call",
    provider="openai",
    model="gpt-4o",
    input_tokens=450,
    output_tokens=120,
    duration_ms=3200,
)
```

### 5.2 Check AI Provider Metrics
```powershell
# Find slow AI calls in logs
gcloud logging read 'jsonPayload.logger=app.services.ai AND jsonPayload.duration_ms>5000' --limit 20
```

### 5.3 AI Provider Performance Optimization

| Issue | Solution |
|-------|----------|
| High latency per call | Reduce max tokens, use faster model (gpt-4o-mini), enable streaming |
| Rate limiting | Implement exponential backoff, request queuing |
| Cost too high | Cache common responses, use smaller model for simple tasks |
| Timeout errors | Increase timeout in AI client configuration |
| Streaming stutter | Reduce chunk size, check WebSocket connection |

### 5.4 AI Client Configuration
```python
# apps/api/app/services/ai/client.py
import httpx
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    timeout=httpx.Timeout(30.0, connect=5.0),  # 30s total, 5s connect
    max_retries=2,
)
```

---

## 6. Infrastructure Performance

### 6.1 Cloud Run Metrics
```powershell
# Check CPU/Memory utilization
gcloud logging read 'resource.type=cloud_run_revision AND jsonPayload.message=~"CPU|Memory"' --limit 20

# View Cloud Run container instance count
gcloud run services describe stadiumos-api --region us-central1 --format="value(status.traffic)"
```

### 6.2 Scaling Issues
| Symptom | Cause | Fix |
|---------|-------|-----|
| Too many cold starts | `min-instances` is 0 | Set `min-instances=2` for production |
| Instances not scaling up | `max-instances` too low | Increase `max-instances` (default 10) |
| Instances scaling too slowly | CPU-based vs concurrent requests | Use `--concurrency` to trigger scaling |

---

## 7. Performance Debugging Workflow

```
1. IDENTIFY the performance issue
   ├── User reports "page is slow"
   ├── Monitoring alert (p95 > 1s)
   └── Lighthouse score dropped

2. ISOLATE the bottleneck
   ├── Is it frontend? (web vitals, bundle size)
   ├── Is it backend? (endpoint latency, DB queries)
   ├── Is it network? (TTFB, CDN, API gateway)
   └── Is it AI provider? (LLM response time)

3. DIAGNOSE the root cause
   ├── Frontend: Lighthouse report, bundle analyzer, React Profiler
   ├── Backend: Cloud Logging slow requests, pg_stat_statements
   ├── Database: EXPLAIN ANALYZE, missing indexes
   └── AI: Provider dashboard, log analysis

4. IMPLEMENT the fix
   ├── Code optimization
   ├── Database index / query rewrite
   ├── Caching strategy adjustment
   └── Infrastructure scaling / configuration change

5. VERIFY the improvement
   ├── Before/after latency comparison
   ├── Lighthouse score re-check
   └── Monitoring dashboard confirms improvement
```

---

## 8. Key Commands Reference

```powershell
# Frontend bundle analysis
npm run analyze

# Lighthouse check
npx lighthouse https://stadiumos.ai --output=json

# Find slow backend endpoints
gcloud logging read 'jsonPayload.duration_ms>1000' --limit 20

# Top DB queries by total time
psql -d stadiumos -c "SELECT query, total_exec_time, calls FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"

# Query plan
psql -d stadiumos -c "EXPLAIN ANALYZE SELECT ..."

# Redis cache hit ratio
redis-cli INFO stats

# Check number of Cloud Run instances
gcloud run services describe stadiumos-api --region us-central1

# Load test
npx autocannon http://localhost:8000/api/v1/venues
```
