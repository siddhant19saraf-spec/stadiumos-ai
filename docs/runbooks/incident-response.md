# Incident Response Runbook

## Purpose
This runbook defines the process for detecting, triaging, containing, resolving, and learning from incidents in the StadiumOS AI platform. It follows the NIST framework (Detection → Triage → Containment → Resolution → Post-Mortem).

---

## 1. Incident Severity Classification

| Severity | Label | Description | Response Time | Examples |
|----------|-------|-------------|---------------|----------|
| **P0** | Critical | Complete platform outage or data loss | Immediate (< 15 min) | Site down, DB corruption, security breach |
| **P1** | High | Major feature broken for all users | < 30 min | Login broken, checkout fails, API returning 500s |
| **P2** | Medium | Feature broken for subset of users | < 4 hours | Search not returning results, slow page load |
| **P3** | Low | Cosmetic or non-critical issue | < 24 hours | Styling bug, minor copy error |
| **P4** | Info | No user impact but needs investigation | Next sprint | Deprecation warning, unused code path |

---

## 2. Detection

Incidents are detected through the following channels:

### 2.1 Automated Alerts
| Alert Source | Channel | Examples |
|-------------|---------|----------|
| Sentry | Slack `#alerts` | JS errors, Python exceptions, unhandled rejections |
| Grafana / Prometheus | Slack `#alerts` | High latency, high error rate, low disk space |
| Cloud Monitoring | Slack `#alerts` | Cloud Run 5xx rate > 1%, database CPU > 90% |
| Uptime Monitoring | Slack `#alerts`, PagerDuty | Site unreachable, SSL cert expiry |
| Vercel Deploy Hooks | Slack `#deployments | Deployment failure, preview deployment |

### 2.2 Manual Detection
- User reports via support ticketing system (Zendesk/Intercom)
- Team member notices issue during normal usage
- Social media monitoring (Twitter, Reddit)
- Partner/vendor escalation

### 2.3 Detection Response
When an alert fires:
1. **Acknowledge** the alert in Slack `/ack` or PagerDuty
2. **Check** if someone is already investigating (check Slack `#incidents` channel)
3. **Declare** incident if confirmed: `!incident P0 - Site is returning 503 for all users`
4. **Create** a dedicated Slack channel: `#incident-YYYYMMDD-brief-description`

---

## 3. Triage

### 3.1 Initial Assessment (First 5 Minutes)
- What is the severity? (P0–P4)
- What is the blast radius? (all users / specific region / specific feature)
- Is data at risk? (security breach, DB corruption, data leak)
- What component is affected? (frontend, backend, database, infrastructure)

### 3.2 Gather Information
```powershell
# Check backend health
curl https://stadiumos-api-xyz-uc.a.run.app/api/v1/health

# Check recent errors in Sentry
# Go to https://sentry.io/organizations/stadiumos/issues/

# Check recent logs
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 50 --freshness=30m

# Check database connectivity
pg_isready -h $DB_HOST -U $DB_USER

# Check Redis
redis-cli -h $REDIS_HOST ping
```

### 3.3 Declare Incident
Use the Slack bot or a pinned message format:
```
INCIDENT: #incident-20260718-api-latency
Severity: P1
Detected: 2026-07-18 14:30 UTC
Detected by: Sentry alert
Service: Backend API
Description: p95 response time increased from 200ms to 5000ms
Impact: All API users experiencing slow responses
Lead: @engineer-name
```

---

## 4. Containment

### 4.1 Feature Flags
If the issue is related to a specific feature and the codebase has feature flags:
```powershell
# Hit the feature flag API to disable the offending feature
curl -X POST https://stadiumos-api-xyz-uc.a.run.app/api/v1/admin/feature-flags/new-ticketing-system \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}'
```

### 4.2 Traffic Diversion / Rollback
- **Frontend issue**: Rollback Vercel deployment (see `rollback.md`)
- **Backend issue**: Rollback Cloud Run revision (see `rollback.md`)
- **Database issue**: Downgrade Alembic migration (see `rollback.md`)
- **Full stack**: Full Docker Compose rollback (see `rollback.md`)

### 4.3 Scale Up (for performance-related incidents)
```powershell
# Increase Cloud Run instances to handle load
gcloud run deploy stadiumos-api `
  --max-instances 50 `
  --region us-central1
```

### 4.4 Block Offending Traffic
```powershell
# If under DoS or bad traffic pattern
# Add WAF rule or block IP via Cloud Armor
gcloud compute security-policies rules create 1000 `
  --security-policy stadiumos-waf `
  --description "Block offending IP range" `
  --src-ip-ranges "203.0.113.0/24" `
  --action deny-403
```

### 4.5 Database Query Blocking
```powershell
# Kill long-running queries
psql -h $DB_HOST -U $DB_USER -d stadiumos -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'active'
    AND query_start < NOW() - INTERVAL '30 seconds'
    AND query NOT LIKE '%pg_stat_activity%';
"
```

---

## 5. Resolution

### 5.1 Hotfix (Code Change)
1. Create a branch from the last known-good commit:
   ```powershell
   git checkout main
   git checkout -b hotfix/issue-description
   ```
2. Apply the fix with minimal changes
3. Push and create a PR — bypass normal review if P0 (but get at least one approval)
4. Merge and deploy:
   ```powershell
   git checkout main
   git merge --no-ff hotfix/issue-description
   git push origin main
   # CI/CD will deploy automatically
   ```

### 5.2 Rollback (No Code Change)
If the issue is not easily fixable, roll back immediately (see `rollback.md`).

### 5.3 Verify Resolution
```powershell
# Check health endpoint
curl https://stadiumos-api-xyz-uc.a.run.app/api/v1/health

# Check error rate
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 10 --freshness=5m

# Verify the specific feature is working
# (Run manual test or check monitoring dashboard)

# Confirm all services are healthy
# Sentry should show no new errors
```

### 5.4 Announce Resolution
```
RESOLVED: #incident-20260718-api-latency
Time: 2026-07-18 15:45 UTC
Duration: 75 minutes
Action: Rolled back to Cloud Run revision stadiumos-api-00004
Root cause: Database query without index on events.start_time
Verification: p95 latency back to 200ms, error rate 0%
```

---

## 6. Post-Mortem

### 6.1 Schedule Post-Mortem
- P0/P1 incidents require a post-mortem within **48 hours**
- P2/P3 incidents may be reviewed in the next sprint retrospective

### 6.2 Post-Mortem Template
```markdown
# Post-Mortem: [Title]

## Incident Details
- Date: YYYY-MM-DD
- Duration: X hours Y minutes
- Severity: P0/P1/P2
- Lead: @engineer-name

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 14:30 | Alert fired: p95 latency > 5s |
| 14:32 | Engineer acknowledged alert |
| 14:35 | Incident declared |
| 14:40 | Rolled back Cloud Run revision |
| 14:45 | Confirmed error rate returning to normal |
| 15:45 | Full resolution confirmed |

## Root Cause
Explain the underlying cause (e.g., "Missing database index caused full table scans on the events table")

## Impact
- Users affected: [X number or percentage]
- Revenue impact: [if measurable]
- Data loss: [yes/no — explain]

## Detection
How was this detected? Could it have been detected faster?

## Response
What went well:
- Quick rollback decision
- Good communication in Slack

What went poorly:
- No dashboard alert for p99 latency
- Database migration wasn't reviewed for query performance

## Action Items
| Action | Owner | Due Date | Ticket |
|--------|-------|----------|--------|
| Add index on events.start_time | @dev | YYYY-MM-DD | ENG-1234 |
| Add p99 latency dashboard alert | @ops | YYYY-MM-DD | ENG-1235 |
| Add database migration performance review step | @dev | YYYY-MM-DD | ENG-1236 |

## Lessons Learned
- Always review migration performance on staging with realistic data volumes
- Add automated query performance regression detection

## Sign-off
- [ ] Engineering Lead
- [ ] Product Manager
- [ ] SRE/Ops Lead
```

### 6.3 Action Items Tracking
- All action items must have an owner and due date
- Track in the project management tool (Linear/Jira)
- Review action items in the next sprint planning

---

## 7. Communication Templates

### 7.1 Internal Slack Message (During Incident)
```
🚨 INCIDENT IN PROGRESS
Service: [Backend/Frontend/Database]
Severity: P0/P1
What's happening: [brief description]
Impact: [who is affected]
Status: [Investigating / Mitigating / Resolved]
Lead: @engineer
Channel: #incident-YYYYMMDD-description
```

### 7.2 External Status Page Update (if applicable)
```
[INVESTIGATING] We are currently investigating an issue with API
responses. Some users may experience slow page loads.
We will provide an update within 15 minutes.
```

```
[RESOLVED] The issue with API response times has been resolved.
All systems are operating normally.
```

---

## 8. Escalation Contacts

| Role | Primary | Secondary |
|------|---------|-----------|
| Engineering Lead | @eng-lead | @senior-dev |
| SRE/Ops | @sre-oncall | @platform-dev |
| Database Admin | @dba | @backend-lead |
| Security | @sec-lead | @eng-lead |
| Product | @pm-lead | @product-owner |
| Executive | @cto | @vp-engineering |

Keep this list updated in the `#incidents` channel topic.
