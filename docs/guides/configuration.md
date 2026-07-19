# Configuration Guide

Reference for all configuration options in StadiumOS AI.

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Secrets Management](#secrets-management)
3. [Configuration Files](#configuration-files)
4. [Feature Flags](#feature-flags)
5. [Development Mode](#development-mode)
6. [Production Mode](#production-mode)

---

## Environment Variables

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Public-facing app URL |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Backend API URL |
| `APP_NAME` | No | `StadiumOS AI` | Application display name |

### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SECRET` | Yes | — | Encryption key for JWT (generate via `openssl rand -base64 32`) |
| `AUTH_URL` | No | `http://localhost:3000` | Auth callback URL |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `JWT_EXPIRY_MINUTES` | No | `15` | Access token lifetime |
| `JWT_REFRESH_EXPIRY_DAYS` | No | `7` | Refresh token lifetime |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL async connection string (`postgresql+asyncpg://user:pass@host:port/db`) |
| `DATABASE_URL_SYNC` | Yes | — | PostgreSQL sync connection string for Alembic |
| `DATABASE_POOL_SIZE` | No | `10` | SQLAlchemy connection pool size |
| `DATABASE_MAX_OVERFLOW` | No | `20` | Max overflow connections |

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | Yes | — | Redis connection string (`redis://host:port/db`) |
| `REDIS_MAX_CONNECTIONS` | No | `10` | Maximum Redis connections |

### AI Providers

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER_PRIMARY` | No | `mock` | Primary AI provider (`mock`, `openai`, `gemini`) |
| `AI_PROVIDER_FALLBACK` | No | `mock` | Fallback AI provider |
| `AI_RATE_LIMIT_REQUESTS_PER_MINUTE` | No | `60` | AI API rate limit |
| `AI_CACHE_TTL_SECONDS` | No | `300` | AI response cache TTL |
| `OPENAI_API_KEY` | When using OpenAI | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o` | OpenAI model name |
| `OPENAI_MAX_TOKENS` | No | `1024` | Max response tokens |
| `OPENAI_TEMPERATURE` | No | `0.7` | Response randomness |
| `GEMINI_API_KEY` | When using Gemini | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-1.5-pro` | Gemini model name |
| `GEMINI_MAX_TOKENS` | No | `1024` | Max response tokens |
| `GEMINI_TEMPERATURE` | No | `0.7` | Response randomness |

### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGINS` | Yes | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | No | `100` | API rate limit per IP |
| `RATE_LIMIT_REQUESTS_PER_MINUTE_ADMIN` | No | `300` | Admin API rate limit |
| `BCRYPT_ROUNDS` | No | `12` | Password hashing rounds |

### External APIs

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEATHER_API_KEY` | Optional | — | Weather data API key |
| `WEATHER_API_BASE_URL` | No | — | Weather API base URL |
| `TRAFFIC_API_KEY` | Optional | — | Traffic data API key |
| `TRAFFIC_API_BASE_URL` | No | — | Traffic API base URL |

### Monitoring

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `SENTRY_DSN` | Optional | — | Sentry error tracking DSN |
| `ENABLE_TELEMETRY` | No | `false` | Enable anonymous usage telemetry |

### Deployment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERCEL_URL` | Auto (Vercel) | — | Vercel deployment URL |
| `DOCKER_IMAGE_TAG` | Auto (Docker) | `latest` | Docker image tag |

---

## Secrets Management

### Local Development

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Generate secrets
openssl rand -base64 32  # For AUTH_SECRET

# 3. Edit .env.local with your values
# .env.local is in .gitignore — never commits
```

### CI/CD (GitHub Actions)

Secrets are stored in [GitHub Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions):

```
AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
JWT_SECRET: ${{ secrets.JWT_SECRET }}
DATABASE_URL: ${{ secrets.DATABASE_URL }}
REDIS_URL: ${{ secrets.REDIS_URL }}
```

### Production (Docker)

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AUTH_SECRET=${AUTH_SECRET}
    secrets:
      - openai_key

secrets:
  openai_key:
    file: ./secrets/openai_key.txt
```

### Secret Rotation

Rotate secrets immediately when:
- A team member with access leaves
- A secret is exposed in logs, error messages, or code
- A secret is pushed to a public repository
- Quarterly rotation for production secrets

---

## Configuration Files

### Frontend Config

| File | Purpose |
|------|---------|
| `frontend/next.config.ts` | Next.js configuration (standalone output, image domains, headers) |
| `frontend/tailwind.config.ts` | Tailwind theme, content paths, dark mode class strategy |
| `frontend/tsconfig.json` | TypeScript strict mode, path aliases |
| `frontend/vitest.config.ts` | Test environment, coverage thresholds, path aliases |
| `frontend/.eslintrc.json` | ESLint rules, Next.js plugin |
| `frontend/.prettierrc` | Prettier formatting rules |
| `frontend/postcss.config.js` | PostCSS plugins (tailwind, autoprefixer) |

### Backend Config

| File | Purpose |
|------|---------|
| `backend/app/core/config.py` | Pydantic Settings loading all env vars |
| `backend/alembic.ini` | Alembic migration configuration |
| `backend/pyproject.toml` | Ruff, Black, Mypy settings |
| `backend/requirements.txt` | Production dependencies |
| `backend/requirements-dev.txt` | Dev dependencies |

---

## Feature Flags

Feature flags are managed through environment variables:

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `AI_PROVIDER_PRIMARY` | String | `mock` | Enable real AI providers |
| `ENABLE_TELEMETRY` | Boolean | `false` | Enable usage telemetry |
| `NEXT_PUBLIC_ENABLE_COPILOT` | Boolean | `true` | Show/hide AI Copilot UI |

To add a new feature flag:
1. Add the variable to `.env.example`
2. Add to `backend/app/core/config.py` (if backend-facing)
3. Document in this file
4. Announce in team channel

---

## Development Mode

### Characteristics

- Hot module replacement via `next dev`
- Backend auto-reload via `uvicorn --reload`
- Mock AI provider (no API keys required)
- SQLite (optional) or local PostgreSQL
- Debug logging level
- Detailed error messages and stack traces
- Unminified source maps

### Configuration

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
AI_PROVIDER_PRIMARY=mock
LOG_LEVEL=debug
```

---

## Production Mode

### Characteristics

- Compiled and optimized Next.js output (`next build`)
- Backend with multiple uvicorn workers
- Real AI provider (OpenAI or Gemini)
- Managed PostgreSQL and Redis
- Info logging level
- Sanitized error responses
- Minified code with source maps disabled
- CDN caching for static assets
- Rate limiting enabled

### Configuration

```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.stadiumos.ai
NEXT_PUBLIC_API_URL=https://api.stadiumos.ai
AI_PROVIDER_PRIMARY=openai  # or gemini
LOG_LEVEL=info
CORS_ORIGINS=https://app.stadiumos.ai
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### Performance Tuning

| Parameter | Dev | Prod | Notes |
|-----------|-----|------|-------|
| Backend workers | 1 | 4 | `uvicorn --workers 4` |
| DB pool size | 5 | 20 | Tune based on connection load |
| Redis max memory | — | 256MB | Set maxmemory-policy allkeys-lru |
| Frontend cache | None | 1 year (static) | immutable hash-based filenames |
