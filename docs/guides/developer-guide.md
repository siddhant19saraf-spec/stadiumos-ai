# Developer Guide

Onboarding and reference for engineers working on StadiumOS AI.

---

## Table of Contents

1. [Local Setup](#local-setup)
2. [Folder Structure](#folder-structure)
3. [Coding Standards](#coding-standards)
4. [Naming Conventions](#naming-conventions)
5. [Working with Features](#working-with-features)
6. [State Management](#state-management)
7. [Data Fetching](#data-fetching)
8. [Testing Workflow](#testing-workflow)
9. [Debugging](#debugging)
10. [Common Pitfalls](#common-pitfalls)

---

## Local Setup

### Prerequisites

```bash
# Verify versions
node --version   # >= 20
python --version # >= 3.12
docker --version # >= 24
pnpm --version   # >= 8
```

### Step-by-Step

```bash
# 1. Clone
git clone https://github.com/your-org/stadiumos-ai.git
cd stadiumos-ai

# 2. Frontend dependencies
cd frontend
pnpm install

# 3. Backend setup
cd ../backend
python -m venv .venv
# Windows:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements-dev.txt

# 4. Start infrastructure
cd ..
docker compose up -d db redis

# 5. Configure environment
cp .env.example .env.local
# Edit .env.local — at minimum set AUTH_SECRET

# 6. Run database migrations
cd backend
alembic upgrade head

# 7. Start development servers
# Terminal 1 — Backend:
uvicorn app.main:app --reload --port 8000
# Terminal 2 — Frontend:
cd frontend && pnpm dev

# 8. Verify
open http://localhost:3000
```

---

## Folder Structure

```
stadiumos-ai/
├── frontend/                     # Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/                  # Pages & layouts
│   │   │   ├── (auth)/           # Auth-optional routes
│   │   │   │   └── login/
│   │   │   └── (dashboard)/      # Protected dashboard routes
│   │   │       ├── layout.tsx    # Shell wrapper
│   │   │       ├── page.tsx      # Redirects → /command-center
│   │   │       ├── a11y-center/
│   │   │       ├── command-center/
│   │   │       └── ...           # 14 module pages
│   │   ├── components/           # Shared UI components
│   │   │   ├── a11y/             # Accessibility components
│   │   │   ├── charts/           # Recharts wrappers
│   │   │   ├── layout/           # Shell, Sidebar, Header
│   │   │   └── ui/               # Primitives (Button, Card, etc.)
│   │   ├── features/             # Domain modules
│   │   │   ├── command-center/
│   │   │   ├── crowd-intelligence/
│   │   │   └── ...               # 14 modules total
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Core utilities
│   │   │   ├── a11y/             # Accessibility utilities
│   │   │   └── performance/      # Performance utilities
│   │   ├── services/             # Global services
│   │   ├── stores/               # Zustand stores
│   │   ├── types/                # Global TypeScript types
│   │   ├── middleware/           # Performance middleware
│   │   └── styles/               # Tailwind globals
│   └── tests/                    # Integration, E2E, security, etc.
│       ├── unit/
│       ├── integration/
│       ├── e2e/
│       ├── security/
│       ├── accessibility/
│       ├── performance/
│       ├── ai-validation/
│       └── error-handling/
├── backend/                      # FastAPI
│   ├── app/
│   │   ├── core/                 # Config, DB, auth, cache
│   │   ├── ai/                   # AI providers
│   │   ├── modules/              # Backend modules
│   │   └── lib/                  # Pagination, response helpers
│   ├── alembic/                  # Migrations
│   └── tests/
├── docs/                         # Documentation
├── infra/                        # K8s, nginx configs
└── docker-compose.yml
```

---

## Coding Standards

### TypeScript

```typescript
// ✅ Good — explicit types, no any, proper naming
interface UserPreferences {
  theme: "light" | "dark";
  sidebar: "expanded" | "collapsed";
}

function useUserPreferences(): UserPreferences {
  // ...
}

// ❌ Avoid — no any, no implicit any, no overly broad types
function process(data: any) {
  // ...
}
```

**Golden Rules:**
- Strict TypeScript mode is enabled — fix all type errors
- Use `unknown` instead of `any` when the type is not known
- Prefer `interface` over `type` for object shapes (better error messages)
- Use union types (`"open" | "closed"`) instead of enums
- Enable `noUncheckedIndexedAccess` — always check array access

### Python

```python
# ✅ Good — type hints, async, docstrings
async def get_zone_analytics(
    db: AsyncSession,
    zone_id: str,
    time_range: TimeRange,
) -> ZoneAnalytics:
    """Compute analytics for a specific zone."""
    query = select(ZoneMetric).where(
        ZoneMetric.zone_id == zone_id,
        ZoneMetric.timestamp.between(time_range.start, time_range.end),
    )
    result = await db.execute(query)
    return ZoneAnalytics.from_orm(result)

# ❌ Avoid — no types, sync in async context
def getData(id):
    return db.query(...)
```

### CSS — Tailwind Only

No custom CSS files. All styling uses Tailwind utility classes:
- Use `cn()` for conditional class merging
- Use `class-variance-authority` for component variants
- Follow the dark theme design tokens
- Respect `prefers-reduced-motion` for animations

---

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `IncidentCard.tsx` |
| Hooks | camelCase, `use` prefix | `useWebSocket.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `CrowdAnalytics` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files (React) | kebab-case.tsx | `main-dashboard.tsx` |
| Files (TS) | kebab-case.ts | `focus-manager.ts` |
| Files (Python) | snake_case.py | `crowd_service.py` |
| Classes (Python) | PascalCase | `CrowdAnalyticsEngine` |
| Functions (Python) | snake_case | `compute_density()` |
| Directories | kebab-case | `command-center/` |
| CSS classes | Tailwind | `flex items-center gap-2` |

---

## Working with Features

### Creating a New Feature Module

```bash
# Create directory structure
mkdir -p src/features/my-module/{components,services,__tests__}
```

**Required files:**
```typescript
// types.ts — All domain types
export interface MyModuleData {
  id: string;
  metrics: Metric[];
}

// services/my-module-service.ts — Orchestrator
export class MyModuleService {
  constructor(private engine: IEngine) {}
  
  async getState(): Promise<MyModuleState> {
    return { data: this.engine.compute() };
  }
}

// components/main-dashboard.tsx — Page component
export function MainDashboard() {
  const { data } = useQuery({
    queryKey: ['my-module'],
    queryFn: () => service.getState(),
  });
  return <div>{/* UI */}</div>;
}
```

### Feature Module Template

Each module follows this structure:
- **Service** orchestrates one or more **Engines**
- **Engines** contain pure business logic (computable, testable)
- **Components** consume services via React Query
- **Types** define the domain data model
- **Constants** hold module-specific configuration values

---

## State Management

### When to Use What

| Need | Solution |
|------|----------|
| Server data (API) | TanStack React Query |
| UI state (theme, sidebar) | Zustand `ui-store` |
| Form state | React Hook Form |
| URL params | `useSearchParams` / `useParams` |
| Real-time data | WebSocket → React Query invalidation |
| Cross-tab state | `useLocalStorage` hook |

### React Query Patterns

```typescript
// Custom query hook pattern
function useCrowdAnalytics(timeRange: TimeRange) {
  return useQuery({
    queryKey: ["crowd", "analytics", timeRange],
    queryFn: () => crowdService.getAnalytics(timeRange),
    staleTime: 30_000,     // 30s before background refetch
    gcTime: 5 * 60_000,    // 5min in cache after unmount
    refetchInterval: 60_000, // Auto-refresh for live data
  });
}
```

---

## Data Fetching

### API Client

All HTTP requests go through `ApiClient` (`lib/api-client.ts`):
- Automatic JWT token injection
- 401 → silent token refresh → retry
- Centralized error handling
- Request/response logging
- Pagination support

```typescript
import { apiClient } from "@/lib/api-client";

// GET
const data = await apiClient.get<ResponseType>("/api/v1/crowd/zones");

// POST with body
const result = await apiClient.post("/api/v1/auth/login", { 
  username, password 
});
```

### WebSocket

```typescript
import { useWebSocket } from "@/hooks/use-websocket";

function LiveUpdates() {
  const { isConnected, subscribe } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL}/events`
  );
  
  useEffect(() => {
    const unsub = subscribe("crowd:update", (data) => {
      queryClient.invalidateQueries({ queryKey: ["crowd"] });
    });
    return unsub;
  }, [subscribe]);
}
```

---

## Testing Workflow

### Running Tests

```bash
# Watch mode during development
pnpm test:watch

# Single module
pnpm test -- --run src/features/crowd

# Coverage
pnpm test:coverage

# All tests pre-push
pnpm test && pnpm typecheck && pnpm lint
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeIncident } from "#tests/fixtures/factories";

describe("IncidentCard", () => {
  it("displays severity level", () => {
    const incident = makeIncident({ severity: "critical" });
    render(<IncidentCard incident={incident} />);
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });
  
  it("calls onResolve when button clicked", async () => {
    const onResolve = vi.fn();
    render(<IncidentCard onResolve={onResolve} />);
    await userEvent.click(screen.getByRole("button", { name: /resolve/i }));
    expect(onResolve).toHaveBeenCalled();
  });
});
```

**Key testing patterns:**
- Use factory functions from `tests/fixtures/factories.ts`
- Mock API calls at the service boundary
- Test behavior, not implementation
- Include error states and edge cases
- Test accessibility (ARIA roles, labels, keyboard navigation)

---

## Debugging

### Frontend

- **React DevTools**: Component tree, props, state
- **TanStack Query DevTools**: Cache state, query status, refetching
- **Zustand DevTools**: Store state and actions
- **Console**: Structured logging via `Logger` class
- **Network tab**: API request/response inspection

### Backend

- **FastAPI `/docs`**: Interactive OpenAPI documentation
- **FastAPI `/redoc`**: ReDoc API documentation
- **Uvicorn logs**: Request logging with timing
- **Pdb**: `import pdb; pdb.set_trace()` for async debugging
- **Logger**: Structured logging with levels

### Common Debugging Commands

```bash
# Check API response
curl http://localhost:8000/health

# Watch frontend logs
pnpm dev -- --turbo

# Watch backend logs with details
uvicorn app.main:app --reload --log-level debug

# Inspect database
docker compose exec db psql -U stadiumos -d stadiumos

# Check Redis
docker compose exec redis redis-cli ping
```

---

## Common Pitfalls

### 1. Missing `"use client"` Directive

Next.js 16 App Router defaults to Server Components. If your component uses hooks, state, or browser APIs, add `"use client"` at the top.

```typescript
"use client";

import { useState } from "react";
```

### 2. Array Access Without Check

TypeScript strict mode requires checked array access:
```typescript
// ❌ May be undefined
elements[0].focus();

// ✅ Safe
elements[0]?.focus();
```

### 3. Async Test Timeouts

Async tests that don't resolve time out after 5s. Ensure:
- Promises are awaited
- Mocks resolve correctly
- No infinite timers

### 4. State Mutation

Zustand and React Query rely on immutability:
```typescript
// ❌ Mutates state
state.items.push(newItem);

// ✅ Creates new array
setState({ items: [...state.items, newItem] });
```

### 5. Environment Variable Access

- Public variables: prefix with `NEXT_PUBLIC_`
- Server-only variables: use `process.env` in server components/API routes
- All variables: defined in `.env.example`

### 6. WebSocket Reconnection

The WebSocket hook auto-reconnects, but:
- Missed messages during disconnection are not replayed
- Consider polling as fallback for critical data
- Connection status is exposed via `isConnected`

### 7. Mock AI Provider

The default `mock` AI provider returns deterministic data. To use real AI:
```
AI_PROVIDER_PRIMARY=openai
# or
AI_PROVIDER_PRIMARY=gemini
```

Set the corresponding API key in `.env.local`.

### 8. Test Isolation

Tests share the jsdom environment. Reset state between tests:
```typescript
afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any side effects
});
```
