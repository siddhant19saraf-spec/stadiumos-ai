# Security Incident Response Runbook

## Purpose
This runbook defines the process for handling security incidents in the StadiumOS AI platform. It covers incident types (unauthorized access, data breach, DoS, dependency vulnerability), containment, investigation, remediation, and post-mortem requirements.

---

## 1. Security Incident Types & Severity

| Type | Description | Typical Severity |
|------|-------------|------------------|
| **Unauthorized Access** | Attacker gains access to user accounts, admin panels, or internal systems | P0 |
| **Data Breach** | Confidential data (PII, payment info, credentials) is exfiltrated | P0 |
| **Denial of Service (DoS)** | Platform is overwhelmed with traffic, causing outage | P1–P0 |
| **Dependency Vulnerability** | Critical CVE in a library used by the platform | P1–P0 |
| **Account Takeover** | User credentials are compromised via brute-force, phishing, or session hijacking | P1 |
| **API Abuse** | Automated scraping, credential stuffing, or rate-limit bypass | P2–P1 |
| **Misconfiguration** | S3 bucket, DB, or API exposed without authentication | P1 |
| **Insider Threat** | Employee or contractor exfiltrates data or intentionally disrupts service | P0 |

---

## 2. Initial Response (First 15 Minutes)

### 2.1 Verify the Incident
- Confirm the alert is not a false positive
- Determine scope: Is it an active attack?
- Gather initial evidence:
  ```powershell
  # Check recent Cloud Run logs for suspicious patterns
  gcloud logging read "resource.type=cloud_run_revision AND severity>=WARNING" --limit 100 --freshness=30m

  # Check authentication logs
  gcloud logging read 'jsonPayload.path="/api/v1/auth/login"' --limit 50 --freshness=30m

  # Check for unusual traffic spikes
  # (via Cloud Monitoring dashboard)
  ```

### 2.2 Declare Security Incident
```
🚨 SECURITY INCIDENT DECLARED
Type: Unauthorized Access / Data Breach / DoS / Dependency Vulnerability
Severity: P0/P1
Detected at: 2026-07-18 14:30 UTC
Detected by: [Sentry / Cloud Monitoring / Manual report]
Description: [brief description of what happened]
Status: Containment in progress
Lead: @security-lead
Channel: #security-incident-YYYYMMDD
```

### 2.3 Assemble Response Team
| Role | Responsibility | Person |
|------|---------------|--------|
| Incident Commander | Coordinates response, makes containment decisions | Security Lead |
| Engineering Lead | Implements technical containment/fix | Senior Engineer |
| Communications Lead | Manages internal and external comms | PM / Ops Lead |
| Legal (if needed) | Handles regulatory notifications | Legal Counsel |
| Executive (if P0) | Informed of critical decisions | CTO / CEO |

---

## 3. Containment

### 3.1 Immediate Containment Actions

| Action | When | How |
|--------|------|-----|
| **Revoke compromised credentials** | Suspected credential leak | Rotate all service account keys, API tokens, DB passwords |
| **Disable compromised user accounts** | Account takeover | `UPDATE users SET is_active = false WHERE id = X` |
| **Block malicious IPs** | DoS, brute-force, scraping | Add to WAF block list |
| **Isolate affected service** | Active breach in progress | Redirect traffic, scale down, or take service offline |
| **Enable read-only mode** | Data integrity at risk | Set `READ_ONLY_MODE=true` env var |
| **Kill active sessions** | Session hijack | Invalidate all sessions via Redis `FLUSHALL` (with caution) |
| **Roll back deployment** | Vulnerable code deployed | See `rollback.md` |

### 3.2 Block IPs via Cloud Armor
```powershell
# Block specific IP
gcloud compute security-policies rules create 1000 `
  --security-policy stadiumos-waf `
  --description "Block malicious IP" `
  --src-ip-ranges "198.51.100.0/24" `
  --action deny-403

# Rate limit a specific path
gcloud compute security-policies rules create 1001 `
  --security-policy stadiumos-waf `
  --description "Rate limit login endpoint" `
  --rate-limit-threshold-count=100 `
  --rate-limit-threshold-interval-sec=60 `
  --conform-action=allow `
  --exceed-action=deny-429 `
  --enforce-on-key=IP
```

### 3.3 Rotate Secrets
```powershell
# Generate new secrets
# 1. Database password
# 2. SECRET_KEY / JWT signing key
# 3. Redis password
# 4. API keys (OpenAI, Stripe, etc.)
# 5. Service account keys

# Update in Cloud Run
gcloud run deploy stadiumos-api `
  --set-env-vars "DATABASE_URL=postgresql://user:NEW_PASS@...,SECRET_KEY=NEW_KEY" `
  --region us-central1

# Update in Vercel
npx vercel env rm SECRET_KEY production
npx vercel env add SECRET_KEY production
```

### 3.4 Take Service Offline (Last Resort)
```powershell
# Scale Cloud Run to zero instances
gcloud run deploy stadiumos-api --min-instances 0 --max-instances 0 --region us-central1

# Or divert all traffic to a maintenance page
gcloud run services update-traffic stadiumos-api `
  --to-revisions=stadiumos-api-maintenance=100 `
  --region us-central1
```

---

## 4. Investigation

### 4.1 Gather Evidence

#### Backend Logs
```powershell
# Export logs for analysis
gcloud logging read "resource.type=cloud_run_revision AND timestamp>='2026-07-18T14:00:00Z'" `
  --format=json --limit=10000 > incident_logs.json

# Focus on auth endpoints
gcloud logging read 'jsonPayload.path="/api/v1/auth/login"' --freshness=2h --format=json

# Look for repeated failure patterns
gcloud logging read 'jsonPayload.status_code=401' --freshness=2h --format=json
```

#### Database Audit
```powershell
# Check for unusual data access patterns
SELECT user_id, COUNT(*) AS login_attempts
FROM login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY COUNT(*) DESC;

# Check for data exfiltration (large reads)
SELECT query, calls, rows
FROM pg_stat_statements
WHERE rows > 10000
  AND query NOT LIKE '%pg_stat%'
ORDER BY rows DESC;
```

#### Container Image Scan
```powershell
# Check current deployed image for vulnerabilities
gcloud artifacts docker images scan `
  gcr.io/stadiumos-prod/stadiumos-api:latest `
  --location=us

# View scan results
gcloud artifacts docker images list-vulnerabilities `
  --resource=gcr.io/stadiumos-prod/stadiumos-api@sha256:...
```

### 4.2 Determine Root Cause

| Question | Evidence to Check |
|----------|-------------------|
| How was access gained? | Auth logs, IP addresses, user agents |
| What data was accessed? | DB audit logs, Cloud Storage access logs |
| When did the breach start? | Earliest suspicious log entry |
| Is it still ongoing? | Current traffic patterns, active sessions |
| What vulnerability was exploited? | Code review, dependency scan, penetration test results |

### 4.3 Preserve Evidence
- Export all relevant logs before they are rotated
- Take database snapshots of affected tables
- Save container images for forensic analysis
- Record IP addresses, timestamps, and user agents
- Do not modify affected systems until evidence is collected

---

## 5. Remediation

### 5.1 Short-Term Fixes (Within Hours)
- [ ] Patch the vulnerability (hotfix deployment)
- [ ] Rotate all credentials and API keys
- [ ] Block attacker IP addresses / user agents
- [ ] Reset all active sessions / force password reset for affected users
- [ ] Enable additional logging and monitoring
- [ ] Apply WAF rules to prevent recurrence

### 5.2 Long-Term Fixes (Within Days/Weeks)
- [ ] Implement security improvements (rate limiting, 2FA, audit logging)
- [ ] Update dependency versions (if CVE-related)
- [ ] Conduct penetration testing on the affected area
- [ ] Review and tighten IAM roles and permissions
- [ ] Implement automated vulnerability scanning in CI/CD
- [ ] Improve alerting for similar incidents

### 5.3 Patch Deployment
```powershell
# 1. Create hotfix branch
git checkout main
git checkout -b security/hotfix-vuln-description

# 2. Apply fix
# 3. Create PR with security label
# 4. Get expedited review
# 5. Merge and deploy
git push origin main
```

---

## 6. Notification & Communication

### 6.1 Internal Communication
| Audience | Message | Channel | Timing |
|----------|---------|---------|--------|
| Response team | Incident details, action items | `#security-incident-*` | Immediate |
| Engineering team | Brief summary, potential impact | `#engineering` | Within 1 hour |
| All staff | High-level notification (if needed) | `#general` | Within 4 hours |
| Board (if P0) | Full incident report | Email | Within 24 hours |

### 6.2 External Notification (if data breach)
- **Legal obligation**: Notify affected users and regulators within 72 hours (GDPR) or applicable timeframe
- **Format**: Email notification with:
  - What happened
  - What data was involved
  - What actions users should take (password reset, monitor accounts)
  - What we are doing in response
  - Contact information for questions

### 6.3 Regulatory Notification Checklist
- [ ] Determine applicable regulations (GDPR, CCPA, SOC2, PCI-DSS)
- [ ] Consult legal counsel before external notification
- [ ] Prepare breach notification letter
- [ ] Submit to regulator (if required within 72 hours)
- [ ] Notify affected users
- [ ] Set up support channel for user inquiries

---

## 7. Post-Mortem

### 7.1 Schedule
- P0 security incidents: Post-mortem within **24 hours**
- P1 security incidents: Post-mortem within **72 hours**
- P2+ security incidents: Ticket in the next sprint

### 7.2 Security Post-Mortem Template
```markdown
# Security Post-Mortem: [Title]

## Classification
- Type: Unauthorized Access / Data Breach / DoS / Dependency / Insider / Misconfig
- Severity: P0/P1/P2
- Date: YYYY-MM-DD
- Duration: X hours Y minutes
- Lead: @security-lead

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 14:30 | [Detection event] |
| 14:35 | Incident declared |
| 14:40 | Containment action taken |
| 15:00 | Service restored / attacker blocked |
| 15:30 | Root cause identified |
| 17:00 | Hotfix deployed |
| 18:00 | All credentials rotated |

## Root Cause
[Detailed explanation of how the incident occurred]

## Impact Assessment
- Users affected: [number]
- Data exposed: [types of data, PII, financial, etc.]
- Systems compromised: [list of services/containers]
- Financial impact: [if measurable]
- Regulatory impact: [GDPR, CCPA, etc.]

## Evidence Collected
- [ ] Cloud Logging exports
- [ ] Database audit logs
- [ ] Container image scan results
- [ ] Network traffic captures
- [ ] Session/access logs

## Containment Effectiveness
What worked:
- [Quick IP blocking]
- [Effective secret rotation process]

What didn't:
- [Alert was delayed by X minutes]
- [No automated IP blocking]

## Action Items
| # | Action | Owner | Due | Ticket |
|---|--------|-------|-----|--------|
| 1 | Add rate limiting to login endpoint | @eng | YYYY-MM-DD | SEC-123 |
| 2 | Implement automated IP blocking | @ops | YYYY-MM-DD | SEC-124 |
| 3 | Run penetration test on auth flow | @sec | YYYY-MM-DD | SEC-125 |
| 4 | Rotate all third-party API keys | @eng | YYYY-MM-DD | SEC-126 |

## Lessons Learned
- [Key takeaway 1]
- [Key takeaway 2]

## Compliance Notifications
- [ ] GDPR breach notification submitted
- [ ] Affected users notified
- [ ] SOC2 incident report filed
- [ ] CCPA notification (if applicable)

## Sign-off
- [ ] Security Lead
- [ ] CTO / VP Engineering
- [ ] Legal Counsel
- [ ] CEO (if P0)
```

### 7.3 Action Items Tracking
- All security action items are P0 priority for the next sprint
- Track in Linear/Jira with `security` label
- Review completion weekly until all items are closed

---

## 8. Prevention & Preparedness

### 8.1 Regular Security Measures
- [ ] Weekly dependency vulnerability scan (Dependabot / Snyk)
- [ ] Monthly penetration testing on critical endpoints
- [ ] Quarterly full security audit
- [ ] Annual third-party security assessment

### 8.2 Security Monitoring
| Monitoring | Tool | Alert On |
|-----------|------|----------|
| Authentication failures | Cloud Logging | > 100 failed logins/min |
| API abuse | Cloud Armor | > 1000 req/min from single IP |
| Data exfiltration | VPC Service Controls | Large outbound data transfers |
| Dependency CVEs | Dependabot | Any critical/high severity CVE |
| Container vulnerabilities | Artifact Registry | Any critical CVE |
| Suspicious requests | WAF / Cloud Armor | SQL injection, XSS patterns |

### 8.3 Access Control Checklist
- [ ] All services use IAM roles, not static credentials
- [ ] Database access is restricted to VPN/internal IP
- [ ] API keys are scoped to minimum required permissions
- [ ] Admin panel requires 2FA
- [ ] Session tokens have short expiry (15 min for access, 7 days for refresh)
- [ ] Audit logging is enabled for all sensitive operations
- [ ] Encryption at rest (AES-256) and in transit (TLS 1.3)

---

## 9. Key Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Security Lead | [Name] | [Phone] | [Email] |
| Engineering Lead | [Name] | [Phone] | [Email] |
| CTO | [Name] | [Phone] | [Email] |
| Legal Counsel | [Name] | [Phone] | [Email] |
| SOC 2 Compliance | [Name] | [Phone] | [Email] |

Update this table in a secure, access-controlled location (e.g., 1Password, PagerDuty).
