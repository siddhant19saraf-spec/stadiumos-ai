# API Reference

Complete reference for the StadiumOS AI backend REST API.

Base URL: `https://api.stadiumos.ai/api/v1` (production) or `http://localhost:8000/api/v1` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health](#health)
3. [Crowd Intelligence](#crowd-intelligence)
4. [Emergency Response](#emergency-response)
5. [Smart Parking](#smart-parking)
6. [Queue Intelligence](#queue-intelligence)
7. [Predictive Maintenance](#predictive-maintenance)
8. [AI Copilot](#ai-copilot)
9. [Enterprise Security](#enterprise-security)
10. [Error Codes](#error-codes)

---

## Authentication

All endpoints (except `/health` and `/auth/login`) require authentication via Bearer JWT token.

### POST /auth/login

Authenticate a user and receive JWT tokens.

**Request:**
```json
{
  "username": "admin",
  "password": "valid_password"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "user-001",
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  }
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 401 | Invalid credentials |
| 429 | Rate limit exceeded |

### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "bmV3IHJlZnJlc2ggdG9rZW4...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### POST /auth/logout

Invalidate the current session.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Health

### GET /health

Check backend service health.

**Response (200):**
```json
{
  "status": "healthy",
  "uptime": 3600.5,
  "version": "0.1.0",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

**Response (503 — degraded):**
```json
{
  "status": "degraded",
  "uptime": 3600.5,
  "version": "0.1.0",
  "checks": {
    "database": "ok",
    "redis": "failed"
  }
}
```

---

## Crowd Intelligence

### GET /crowd/zones

Retrieve all stadium zones with current crowd data.

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by status (clear, moderate, congested, critical) |
| `page` | integer | No | 1 | Page number |
| `page_size` | integer | No | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "zone-001",
      "name": "Section 214",
      "capacity": 2500,
      "currentOccupancy": 1800,
      "densityPercent": 72,
      "status": "moderate",
      "trend": "increasing",
      "lastUpdated": "2026-07-18T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 54,
    "totalPages": 3
  }
}
```

### GET /crowd/zones/{zone_id}

Retrieve a specific zone's data.

**Response (200):**
```json
{
  "id": "zone-001",
  "name": "Section 214",
  "capacity": 2500,
  "currentOccupancy": 1800,
  "densityPercent": 72,
  "status": "moderate",
  "trend": "increasing",
  "entryRate": 45,
  "exitRate": 30,
  "averageDwellTime": 25,
  "lastUpdated": "2026-07-18T14:30:00Z"
}
```

### GET /crowd/analytics

Retrieve aggregated crowd analytics.

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `time_range` | string | No | `24h` | Analysis period (1h, 24h, 7d, 30d) |

**Response (200):**
```json
{
  "totalVisitors": 45230,
  "peakOccupancy": 85,
  "averageDensity": 62,
  "congestedZones": 3,
  "criticalZones": 1,
  "zoneDistribution": [
    { "status": "clear", "count": 18 },
    { "status": "moderate", "count": 28 },
    { "status": "congested", "count": 6 },
    { "status": "critical", "count": 2 }
  ],
  "timeSeriesData": [
    { "timestamp": "2026-07-18T14:00:00Z", "totalVisitors": 44100, "averageDensity": 60 }
  ]
}
```

### GET /crowd/predictions

Retrieve crowd predictions.

**Response (200):**
```json
{
  "predictions": [
    {
      "zoneId": "zone-001",
      "currentDensity": 72,
      "predictedDensity": 88,
      "timeframe": "30min",
      "confidence": 0.85,
      "peakTime": "2026-07-18T15:00:00Z"
    }
  ]
}
```

---

## Emergency Response

### GET /emergency/incidents

Retrieve active incidents.

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by status (active, resolved, triaging) |
| `severity` | string | No | — | Filter by severity (low, medium, high, critical) |
| `page` | integer | No | 1 | Page number |
| `page_size` | integer | No | 20 | Items per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": "incident-001",
      "type": "medical",
      "severity": "critical",
      "status": "active",
      "location": "Section 214",
      "description": "Fan experiencing cardiac distress",
      "reportedAt": "2026-07-18T14:25:00Z",
      "assignedTeam": "med-team-01",
      "aiAnalysis": {
        "riskLevel": "high",
        "recommendedAction": "Immediate medical evacuation",
        "estimatedResponseTime": "3min"
      }
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 5, "totalPages": 1 }
}
```

### POST /emergency/incidents

Report a new incident.

**Request:**
```json
{
  "type": "fire",
  "severity": "high",
  "location": "Section 112, Row 15",
  "description": "Small fire near concession stand",
  "reportedBy": "staff-042"
}
```

**Response (201):**
```json
{
  "id": "incident-045",
  "status": "triaging",
  "aiAnalysis": {
    "riskLevel": "high",
    "recommendedAction": "Dispatch fire team immediately",
    "estimatedResponseTime": "2min"
  },
  "createdAt": "2026-07-18T14:35:00Z"
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid incident data |
| 403 | Insufficient permissions |

### POST /emergency/incidents/{incident_id}/dispatch

Dispatch a response team to an incident.

**Request:**
```json
{
  "team_id": "fire-team-03"
}
```

**Response (200):**
```json
{
  "incident_id": "incident-045",
  "team_id": "fire-team-03",
  "status": "dispatched",
  "estimated_arrival": "2026-07-18T14:37:00Z"
}
```

### POST /emergency/incidents/{incident_id}/resolve

Resolve an incident.

**Request:**
```json
{
  "resolution_notes": "Fire contained, area secure. No injuries."
}
```

**Response (200):**
```json
{
  "incident_id": "incident-045",
  "status": "resolved",
  "resolvedAt": "2026-07-18T15:00:00Z",
  "duration_minutes": 25
}
```

---

## Smart Parking

### GET /parking/lots

Retrieve all parking lots with occupancy data.

**Response (200):**
```json
{
  "data": [
    {
      "id": "lot-a",
      "name": "Lot A — North Entrance",
      "totalSpaces": 1200,
      "occupied": 850,
      "available": 320,
      "reserved": 30,
      "occupancyPercent": 71,
      "status": "moderate",
      "entryRate": 25,
      "exitRate": 18
    }
  ]
}
```

### GET /parking/lots/{lot_id}

Retrieve a specific parking lot's detailed data.

**Response (200):**
```json
{
  "id": "lot-a",
  "name": "Lot A — North Entrance",
  "totalSpaces": 1200,
  "occupied": 850,
  "available": 320,
  "reserved": 30,
  "blocked": 0,
  "occupancyPercent": 71,
  "status": "moderate",
  "entryRate": 25,
  "exitRate": 18,
  "sections": [
    {
      "id": "lot-a-sec-1",
      "label": "Section A1",
      "total": 200,
      "occupied": 150,
      "status": "moderate"
    }
  ],
  "predictions": {
    "peakTime": "2026-07-18T18:00:00Z",
    "peakOccupancy": 95,
    "fullLotProbability": 0.65
  }
}
```

---

## Queue Intelligence

### GET /queue/status

Retrieve current queue status for all concession points.

**Response (200):**
```json
{
  "data": [
    {
      "id": "concession-01",
      "name": "Main Concourse — East",
      "currentLength": 45,
      "estimatedWaitMin": 12,
      "serviceRate": 3.5,
      "status": "busy",
      "staffAssigned": 4,
      "optimalStaff": 6
    }
  ]
}
```

### GET /queue/predictions

Retrieve queue predictions.

**Response (200):**
```json
{
  "predictions": [
    {
      "pointId": "concession-01",
      "currentWait": 12,
      "predictedWait": 18,
      "timeframe": "15min",
      "confidence": 0.82
    }
  ]
}
```

---

## Predictive Maintenance

### GET /maintenance/assets

Retrieve all monitored assets.

**Response (200):**
```json
{
  "data": [
    {
      "id": "hvac-001",
      "name": "HVAC Unit 1 — South Wing",
      "type": "hvac",
      "healthScore": 78,
      "status": "warning",
      "lastMaintenance": "2026-06-15",
      "nextMaintenanceDue": "2026-08-15",
      "failureProbability": 0.15
    }
  ]
}
```

### GET /maintenance/assets/{asset_id}

Retrieve detailed asset data.

**Response (200):**
```json
{
  "id": "hvac-001",
  "name": "HVAC Unit 1 — South Wing",
  "type": "hvac",
  "healthScore": 78,
  "status": "warning",
  "metrics": {
    "temperature": 22.5,
    "vibration": 0.45,
    "runtime_hours": 12500,
    "efficiency": 0.82
  },
  "failurePrediction": {
    "probability": 0.15,
    "estimatedTimeToFailure": "45 days",
    "contributingFactors": ["bearing wear", "filter clogging"]
  },
  "maintenanceHistory": [
    { "date": "2026-06-15", "type": "preventive", "description": "Filter replacement" }
  ]
}
```

---

## AI Copilot

### POST /ai/copilot/chat

Send a message to the AI Copilot and receive a response.

**Request:**
```json
{
  "message": "What's the current crowd situation?",
  "context": {
    "module": "crowd-intelligence",
    "timeRange": "1h"
  },
  "conversation_id": "conv-123"
}
```

**Response (200):**
```json
{
  "response": "All zones are currently at moderate density (avg 62%). Section 214 is trending up — expected to reach 85% within 30 minutes.",
  "conversation_id": "conv-123",
  "actions": [
    { "type": "view", "label": "View Crowd Dashboard", "path": "/crowd-intelligence" }
  ],
  "confidence": 0.92,
  "provider": "openai",
  "latency_ms": 1200
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 429 | AI rate limit exceeded |
| 502 | AI provider unavailable (fallback attempted) |

---

## Enterprise Security

### GET /security/audit-logs

Retrieve security audit logs.

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user_id` | string | No | — | Filter by user |
| `action` | string | No | — | Filter by action type |
| `from` | datetime | No | 24h ago | Start of time range |
| `to` | datetime | No | now | End of time range |
| `page` | integer | No | 1 | Page number |
| `page_size` | integer | No | 50 | Items per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": "audit-001",
      "user_id": "user-001",
      "action": "login",
      "resource": "auth",
      "details": { "ip": "192.168.1.100", "method": "password" },
      "timestamp": "2026-07-18T14:00:00Z",
      "success": true
    }
  ]
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource state conflict |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | AI provider unavailable |
| 503 | Service Unavailable | Backend degraded or under maintenance |

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "severity",
        "message": "Must be one of: low, medium, high, critical"
      }
    ],
    "request_id": "req-abc-123-def"
  }
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Username or password incorrect |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Access token is invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required role |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 422 | Request body fails validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_PROVIDER_ERROR` | 502 | AI provider returned an error |
| `AI_RATE_LIMIT` | 429 | AI API rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
