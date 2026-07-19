# Rollback Runbook

## Purpose
This runbook covers how to roll back a deployment for each component of StadiumOS AI — frontend, backend, database, and full-stack Docker Compose — in the event of a failed or problematic release.

---

## 1. General Rollback Principles

- **Stop the bleeding first**: If a deployment is causing user-facing errors, roll back immediately. Investigate later.
- **Communicate**: Notify the team via Slack `#incidents` channel before and after rollback.
- **Database first, then backend, then frontend**: When rolling back the full stack, reverse database changes first, then deploy previous backend, then revert frontend.
- **Database rollbacks are not always safe**: Data added since the forward migration may be lost. Assess before rolling back.
- **Tag everything**: Always tag Docker images and Vercel deployments with build numbers or commit hashes.

---

## 2. Frontend Rollback (Vercel)

### 2.1 Instant Rollback via Vercel Dashboard
1. Navigate to [Vercel Dashboard](https://vercel.com/stadiumos/stadiumos-web)
2. Go to **Deployments** tab
3. Find the last known-good deployment
4. Click the **•••** menu → **Promote to Production**
5. Confirm the rollback

### 2.2 Rollback via Vercel CLI
```powershell
# List recent deployments
npx vercel list

# Find the deployment URL of the previous good version
# Promote that deployment to production
npx vercel promote <deployment-url-or-id>
```

### 2.3 Verify Frontend Rollback
```powershell
curl -I https://stadiumos.ai
# Check the x-vercel-id header shows the correct deployment
```

### 2.4 Revert Vercel Environment Variables (if changed)
```powershell
npx vercel env pull
# Edit .env file with previous values
npx vercel env push
```

---

## 3. Backend Rollback (Cloud Run)

### 3.1 Rollback to Previous Revision
```powershell
# List revisions for the service
gcloud run revisions list `
  --service stadiumos-api `
  --region us-central1

# Identify the previous stable revision (e.g., stadiumos-api-00004-bix)
# Roll back traffic to that revision
gcloud run services update-traffic stadiumos-api `
  --to-revisions=stadiumos-api-00004-bix=100 `
  --region us-central1
```

### 3.2 Rollback to a Specific Container Tag
```powershell
# If you need to deploy a specific previous image
gcloud run deploy stadiumos-api `
  --image gcr.io/stadiumos-prod/stadiumos-api:v1.2.3 `
  --region us-central1
```

### 3.3 Managed Rollback (Points to 100% traffic on a previous revision)
```powershell
# Cloud Run supports managed rollback to any revision
gcloud run services update-traffic stadiumos-api `
  --to-revisions=stadiumos-api-00004-bix=100 `
  --region us-central1
```

### 3.4 Gradual Rollback (if you want to canary)
```powershell
# Send 10% traffic to new, 90% to old
gcloud run services update-traffic stadiumos-api `
  --to-revisions=stadiumos-api-00004-bix=90,stadiumos-api-00005-bix=10 `
  --region us-central1

# Then shift to 100% old if things look bad
gcloud run services update-traffic stadiumos-api `
  --to-revisions=stadiumos-api-00004-bix=100 `
  --region us-central1
```

### 3.5 Verify Backend Rollback
```powershell
curl https://stadiumos-api-xyz-uc.a.run.app/api/v1/health
# Check the x-cloud-run-revision-id header matches expected revision
```

---

## 4. Database Rollback (Alembic Downgrade)

### 4.1 Before Rolling Back Database
- [ ] Confirm that the migration has a `downgrade()` function
- [ ] Understand what data will be lost (downgrade is destructive)
- [ ] Take a full database backup before downgrading
- [ ] Communicate with the team — a DB rollback may cause data loss

### 4.2 Take a Database Backup
```powershell
# Production
pg_dump "postgresql://user:pass@host:5432/stadiumos" `
  --no-owner --clean --if-exists `
  -f "stadiumos_backup_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
```

### 4.3 List Migration History
```powershell
alembic history
# Shows:
# 1234abc (2026-07-18) -> 5678def (head) Add events table
# 9012ghi (2026-07-17) -> 1234abc Add venues table
```

### 4.4 Downgrade by One Revision
```powershell
alembic downgrade -1
```

### 4.5 Downgrade to a Specific Revision
```powershell
alembic downgrade 1234abc
```

### 4.6 Downgrade to Base (complete rollback)
```powershell
alembic downgrade base
```

### 4.7 Verify Database Rollback
```powershell
# Check the current revision
alembic current

# Confirm the schema is in expected state
psql -h localhost -U stadiumos -d stadiumos -c "\dt"

# Run a quick sanity query
psql -h localhost -U stadiumos -d stadiumos -c "SELECT COUNT(*) FROM alembic_version;"
```

---

## 5. Docker Compose Rollback (Full Stack)

### 5.1 Rollback to Previous Image Tag
```powershell
# Stop current services
docker compose down

# Update compose file or override with previous tags
# e.g., change image: stadiumos-api:latest to stadiumos-api:v1.2.3

# Start with previous images
docker compose up -d
```

### 5.2 Rollback Using Git (if using :latest tags)
```powershell
# Checkout the previous deployment commit
git checkout <previous-deployment-tag>

# Rebuild and restart
docker compose up -d --build
```

### 5.3 Verify Docker Compose Rollback
```powershell
docker compose ps
docker compose logs --tail=50 stadiumos-api
curl http://localhost:8000/api/v1/health
curl http://localhost:3000
```

---

## 6. Rollback Decision Matrix

| Scenario | Frontend | Backend | Database | Priority |
|----------|----------|---------|----------|----------|
| UI rendering bug / broken page | Rollback Vercel | No action | No action | P0 |
| API returning 500 errors | No action | Rollback Cloud Run | No action | P0 |
| API returning wrong data | No action | Rollback Cloud Run | Check if DB migration caused it | P1 |
| New DB migration breaks queries | No action | Rollback Cloud Run | Downgrade Alembic | P0 |
| Security vulnerability | Rollback Vercel | Rollback Cloud Run | Assess | P0 |
| Slow performance (regression) | Check frontend first | Rollback Cloud Run | Check query plan | P1 |

---

## 7. Post-Rollback Tasks

- [ ] Confirm the rollback resolved the issue
- [ ] Update the deployment status in Slack `#incidents`
- [ ] Tag the broken deployment in git: `git tag -a broken/v1.2.4 -m "Rolled back due to ..."`
- [ ] Open a bug/incident ticket to track the root cause
- [ ] Schedule a post-mortem if it was a P0/P1 incident
- [ ] Ensure CI/CD pipeline is not blocked
