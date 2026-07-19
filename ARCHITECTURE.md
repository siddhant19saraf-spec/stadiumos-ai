# StadiumOS AI — Architecture

> Version 1.0 · Last updated: July 2026

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Module Architecture](#module-architecture)
6. [Data Flow](#data-flow)
7. [AI Service Layer](#ai-service-layer)
8. [Digital Twin Architecture](#digital-twin-architecture)
9. [Security Architecture](#security-architecture)
10. [Performance Architecture](#performance-architecture)
11. [Scalability Strategy](#scalability-strategy)

---

## System Overview

StadiumOS AI is a full-stack, event-driven platform that provides real-time operational intelligence for stadium management. It comprises a Next.js 16 frontend (App Router, React 19) and a FastAPI Python 3.12 backend, communicating via REST APIs and Redis-backed WebSockets.

### Design Principles

- **Feature-Sliced Architecture** — Each operational domain is a self-contained module with its own types, services, components, and tests
- **Interface-Driven Abstraction** — AI providers, engines, and services implement interfaces for hot-swappable implementations
- **Event-Driven Communication** — Backend modules communicate via a Redis event bus; frontend subscribes via WebSocket
- **Performance by Default** — Memoization, caching (TTL, stale-while-revalidate), debouncing, and concurrency control are built into the core library
- **Accessibility First** — Every component is built with WCAG 2.2 AA compliance from the ground up

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Clients
        B[Browser]
    end

    subgraph "Frontend (Next.js 16)"
        LR[Root Layout]
        DP[Dashboard Layout]
        
        subgraph "Feature Modules"
            CC[Command Center]
            CI[Crowd Intelligence]
            ER[Emergency Response]
            DT[Digital Twin]
            AC[AI Copilot]
            PM[Predictive Maintenance]
            SP[Smart Parking]
            QI[Queue Intelligence]
            EA[Executive Analytics]
            ES[Enterprise Security]
            TO[Tournament Ops]
            SU[Sustainability]
            AL[Accessibility Center]
            PC[Performance Center]
        end

        subgraph "Core Libraries"
            RC[React Query]
            ZS[Zustand]
            WS[WebSocket]
            PF[Performance]
            ALib[Accessibility]
        end

        subgraph "UI Components"
            SH[Shell / Sidebar / Header]
            CH[Charts]
            UI[UI Primitives]
        end
    end

    subgraph "Backend (FastAPI)"
        API[API Gateway]
        AUTH[Auth + RBAC]
        AI[AI Gateway]
        
        subgraph "Module Routers"
            CR[Crowd]
            OT[...Other Modules]
        end
        
        EB[Event Bus / Redis]
        CACHE[Redis Cache]
        DB[(PostgreSQL)]
        WK[Background Workers]
    end

    B --> LR
    LR --> DP
    DP --> CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU & AL & PC
    CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU & AL & PC --> RC & ZS & WS
    RC --> API
    WS --> EB
    API --> AUTH
    API --> AI
    API --> CR & OT
    CR & OT --> DB
    CR & OT --> EB
    EB --> WK
    AI --> OpenAI & Gemini
```

---

## Frontend Architecture

### Layer Structure

```
Presentation Layer
├── App Router Pages          (app/ directory)
├── Feature Components       (features/*/components/)
└── Shared Components        (components/)

State Layer
├── Server State             (TanStack React Query)
├── Client State             (Zustand)
└── URL State                (next/navigation)

Infrastructure Layer
├── API Client               (lib/api-client.ts)
├── WebSocket                (hooks/use-websocket.ts)
├── Performance              (lib/performance/)
└── Accessibility            (lib/a11y/)
```

### Routing Structure

```mermaid
graph TD
    RL[root layout.tsx] --> PL[(auth)/layout.tsx]
    RL --> DL[(dashboard)/layout.tsx]
    
    PL --> LG[login/page.tsx]
    PL --> RG[register/page.tsx]
    
    DL --> SH[Shell component]
    SH --> SB[Sidebar]
    SH --> HD[Header]
    SH --> MC[main#main-content]
    
    MC --> CC[/command-center]
    MC --> CI[/crowd-intelligence]
    MC --> ER[/emergency-response]
    MC --> DT[/digital-twin]
    MC --> AC[/ai-copilot]
    MC --> PM[/maintenance]
    MC --> SP[/smart-parking]
    MC --> QI[/queue-intelligence]
    MC --> EA[/executive-analytics]
    MC --> ES[/enterprise-security]
    MC --> TO[/tournament-ops]
    MC --> SU[/sustainability]
    MC --> AL[/a11y-center]
    MC --> PC[/performance]
```

### State Management Strategy

| State Type | Technology | When to Use |
|-----------|-----------|-------------|
| Server state | TanStack React Query | API data, cache, background refetching |
| Client state | Zustand | UI state (theme, sidebar, active module) |
| URL state | next/navigation | Page-level state, search params |
| Form state | React Hook Form | Form inputs, validation |
| WebSocket | Custom hook + React Query | Real-time updates |

### Component Architecture

Each feature module follows the pattern:

```
features/<module>/
├── types.ts              # Domain types and interfaces
├── constants.ts          # Module-specific constants
├── services/
│   ├── <module>-service.ts    # Service orchestrator
│   ├── <domain>-engine.ts     # Domain logic engines
│   └── ...                    # Additional engines
├── components/
│   ├── main-dashboard.tsx     # Primary page component
│   ├── <domain>-panel.tsx     # Feature panels
│   └── ...                    # Supporting components
└── __tests__/
    └── <module>.test.ts       # Unit tests
```

---

## Backend Architecture

### Layer Structure

```
API Layer
├── Router                  (module-level route definitions)
├── Models                  (Pydantic request/response models)
└── Dependencies            (auth, pagination, DB session)

Service Layer
├── Module Services         (business logic orchestration)
├── AI Provider Abstraction (base.py → OpenAI/Gemini providers)
└── Event Bus               (Redis pub/sub)

Data Layer
├── SQLAlchemy Models       (database ORM models)
├── Alembic Migrations      (schema versioning)
└── Redis Cache             (aiocache-decorated functions)
```

### Module Dependency Flow

```mermaid
graph LR
    FR[Frontend] -->|REST API| API[API Router]
    FR -->|WebSocket| EB[Event Bus]
    
    API --> AUTH[Auth Dependency]
    API --> SVC[Module Service]
    
    SVC --> ENG[Engines]
    SVC --> AI[AI Provider]
    SVC --> DB[(Database)]
    SVC --> CA[Redis Cache]
    
    ENG --> EB
    
    EB --> WS[WebSocket]
    EB --> WK[Workers]
    
    AI --> OPENAI[OpenAI]
    AI --> GEMINI[Gemini]
    AI --> MOCK[Mock Provider]
```

---

## Module Architecture

### Shared Module Template

Every feature module implements the same structural contract:

```typescript
// types.ts — Domain-specific type definitions
interface ModuleData {
  id: string;
  metrics: Metric[];
  status: Status;
}

// service.ts — Orchestrator that composes engines
class ModuleService {
  constructor(
    private analyticsEngine: IAnalyticsEngine,
    private predictionEngine: IPredictionEngine,
    private recommendationEngine: IRecommendationEngine,
  ) {}

  async getFullState(): Promise<ModuleState> {
    const analytics = this.analyticsEngine.compute(/* ... */);
    const predictions = this.predictionEngine.predict(/* ... */);
    const recommendations = this.recommendationEngine.generate(/* ... */);
    return { analytics, predictions, recommendations };
  }
}

// components/main-dashboard.tsx — Page-level composition
function MainDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['module-state'],
    queryFn: () => moduleService.getFullState(),
  });
  return <DashboardShell>{/* compose sub-components */}</DashboardShell>;
}
```

### Module Dependency Graph

```mermaid
graph TD
    EA[Executive Analytics] --> CC[Command Center]
    EA --> CI[Crowd Intelligence]
    EA --> ER[Emergency Response]
    EA --> PM[Predictive Maintenance]
    EA --> SP[Smart Parking]
    EA --> QI[Queue Intelligence]
    EA --> TO[Tournament Ops]
    EA --> SU[Sustainability]
    
    CC --> CI
    CC --> ER
    CC --> DT[Digital Twin]
    CC --> AC[AI Copilot]
    
    DT --> CI
    DT --> SP
    DT --> PM
    
    AC --> CI
    AC --> ER
    AC --> PM
    AC --> SP
    AC --> QI
    AC --> TO
    
    PC[Performance Center] --> ALL[All Modules]
    AL[Accessibility Center] --> ALL
    ES[Enterprise Security] --> ALL
```

---

## Data Flow

### Request Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant P as Page Component
    participant RQ as React Query
    participant CL as API Client
    participant BE as Backend API
    participant SVC as Module Service
    participant DB as Database
    participant CA as Redis Cache

    U->>P: Navigate to module
    P->>RQ: useQuery('module-key')
    
    alt Cache hit
        RQ->>CA: Check cache
        CA-->>RQ: Cached data
    else Cache miss
        RQ->>CL: GET /api/v1/module/data
        CL->>BE: HTTP request with JWT
        BE->>SVC: Process request
        SVC->>DB: Query data
        DB-->>SVC: Raw data
        SVC->>SVC: Run engines
        SVC->>CA: Cache result
        SVC-->>BE: Response
        BE-->>CL: JSON response
        CL-->>RQ: Parsed data
    end
    
    RQ-->>P: Data
    P->>P: Render components
```

### Real-Time Data Flow

```mermaid
sequenceDiagram
    participant BE as Backend Engine
    participant EB as Event Bus (Redis)
    participant WS as WebSocket Server
    participant WH as useWebSocket Hook
    participant RQ as React Query
    participant P as Page

    loop Every N seconds
        BE->>BE: Compute updates
        BE->>EB: Publish event
        EB->>WS: Forward to subscribers
        WS->>WH: Push event
        WH->>RQ: invalidateQueries
        RQ->>P: Re-render with fresh data
    end
```

### AI Recommendation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Page
    participant RQ as React Query
    participant CL as API Client
    participant BE as Backend
    participant AI as AI Gateway
    participant LLM as LLM Provider

    U->>P: Request recommendation
    P->>RQ: useQuery('recommendations')
    RQ->>CL: GET /api/v1/module/recommendations
    
    CL->>BE: HTTP request
    BE->>BE: Collect context data
    BE->>BE: Build prompt
    BE->>AI: Generate recommendation
    AI->>LLM: API call (OpenAI/Gemini)
    LLM-->>AI: Response
    AI-->>BE: Parsed recommendation
    
    BE->>BE: Validate + cache
    BE-->>CL: Response
    CL-->>RQ: Recommendation data
    RQ-->>P: Render recommendations
```

---

## AI Service Layer

### Provider Abstraction

```python
# backend/app/ai/base.py
class AIProvider(ABC):
    @abstractmethod
    async def generate(
        self, prompt: str, context: dict
    ) -> AIResponse: ...

class OpenAIProvider(AIProvider):
    async def generate(self, prompt, context):
        # Calls OpenAI API
        ...

class GeminiProvider(AIProvider):
    async def generate(self, prompt, context):
        # Calls Google Gemini API
        ...

class MockProvider(AIProvider):
    async def generate(self, prompt, context):
        # Returns deterministic mock data for development
        ...
```

### Provider Selection Strategy

```mermaid
graph TD
    REQ[AI Request] --> SELECT{Provider Selection}
    SELECT -->|AI_PROVIDER_PRIMARY=mock| MOCK[Mock Provider]
    SELECT -->|AI_PROVIDER_PRIMARY=openai| OAI[OpenAI Provider]
    SELECT -->|AI_PROVIDER_PRIMARY=gemini| GEM[Gemini Provider]
    
    OAI -->|Fails| FALLBACK{Fallback?}
    GEM -->|Fails| FALLBACK
    FALLBACK -->|ai_provider_fallback| MOCK
    FALLBACK -->|None| ERR[Return Error]
```

---

## Digital Twin Architecture

```mermaid
graph TB
    subgraph "Frontend"
        DT[Digital Twin Dashboard]
        SM[Stadium Map]
        LC[Layer Controls]
        TC[Time Travel Controls]
        SC[Simulation Controls]
    end

    subgraph "Backend"
        DTE[Digital Twin Engine]
        VE[Visualization Engine]
        SE[Simulation Engine]
        PE[Prediction Engine]
        AE[Analytics Engine]
        ME[Map Engine]
    end

    subgraph "Data Sources"
        SENSOR[Sensor Data]
        HIST[Historical Data]
        LIVE[Live Feeds]
    end

    DT --> DTE
    DTE --> VE & SE & PE & AE & ME
    VE --> SM
    SE --> SC
    PE --> LC
    AE --> TC
    
    DTE --> SENSOR & HIST & LIVE
```

---

## Security Architecture

```mermaid
graph TD
    REQ[Request] --> AUTH{Authenticated?}
    AUTH -->|No| LOGIN[Login Page]
    AUTH -->|Yes| RBAC{RBAC Check}
    
    RBAC -->|Authorized| MOD[Module Access]
    RBAC -->|Unauthorized| 403[403 Forbidden]
    
    MOD --> AUDIT[Audit Log]
    MOD --> SESSION[Session Check]
    SESSION -->|Expired| REFRESH[Token Refresh]
    SESSION -->|Valid| PROCESS[Process Request]
    
    subgraph "Auth Flow"
        JWT[JWT Access Token]
        REF[Refresh Token]
        BCRYPT[Bcrypt Password Hash]
    end
```

### Authentication Flow

1. User submits credentials → POST `/api/auth/login`
2. Backend validates password with bcrypt
3. Returns JWT access token (short-lived) + refresh token (long-lived)
4. Frontend stores tokens, attaches JWT to subsequent requests via `ApiClient`
5. On 401, frontend attempts silent refresh with refresh token
6. On refresh failure, redirects to login

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `admin` | Full system access, user management, configuration |
| `operator` | Module operations, incident management |
| `viewer` | Read-only dashboard access |
| `security` | Security module + incident management |
| `maintenance` | Maintenance module + work orders |

---

## Performance Architecture

```mermaid
graph TD
    subgraph "Frontend Performance"
        MEM[Memoization Layer]
        CACHE[React Query Cache]
        DEB[Debounce / Throttle]
        VIRT[React Virtual]
        LAZY[Lazy Loading]
    end

    subgraph "Backend Performance"
        RC[Redis Cache]
        CP[Connection Pooling]
        ASYNC[Async/Await]
        Q[Background Queue]
    end

    subgraph "Monitoring"
        PM[Performance Monitor]
        WV[Web Vitals]
        LAT[Latency Tracking]
    end

    MEM & CACHE & DEB & VIRT & LAZY --> PM
    RC & CP & ASYNC & Q --> PM
    PM --> WV & LAT
```

Key performance patterns:
- **Memoization** — `memoize()`, `memoizeAsync()` with TTL and LRU eviction
- **Caching** — Multi-tier (React Query → Redis → Database)
- **Concurrency** — `createAsyncQueue(n)` for controlled parallelism
- **Batching** — `createBatchProcessor()` for coalescing requests
- **Debouncing** — User input handlers, search, resize events
- **Virtualization** — TanStack React Virtual for long lists
- **Lazy Loading** — `lazyComponent()` for code-split modules

---

## Scalability Strategy

### Horizontal Scaling

| Component | Strategy |
|-----------|----------|
| Frontend | Stateless, CDN-cached static assets, Vercel edge functions |
| Backend | Multiple uvicorn workers → multiple container instances → auto-scaling |
| Database | Read replicas, connection pooling (pgbouncer-ready) |
| Cache | Redis Cluster for distributed caching |
| WebSocket | Redis pub/sub for cross-instance message broadcasting |
| Background Jobs | ARQ worker pool with Redis broker |

### Cache Strategy

```
Browser Cache (CDN)
    ↓ (Cache-Control headers)
React Query Cache (in-memory, staleTime: 30s)
    ↓ (stale-while-revalidate)
Redis Cache (aiocache, TTL: 5min)
    ↓ (cache-aside pattern)
PostgreSQL Database
```

### Data Partitioning

- Modules are logically separated by module ID prefix
- Time-series data sharded by timestamp ranges
- Read replicas handle analytics/reporting queries
- Write master handles operational transactions

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 | SSR/SSG/ISR, App Router, React Server Components, Vercel deployment |
| State | React Query + Zustand | Separation of server/client state, cache invalidation, devtools |
| Styling | Tailwind CSS | Utility-first, small bundle, consistent design tokens |
| Backend | FastAPI | Async-native, Pydantic validation, OpenAPI docs, high performance |
| Database | PostgreSQL + SQLAlchemy | Relational integrity, async ORM, mature ecosystem |
| Cache | Redis | Pub/sub, TTL, distributed, proven at scale |
| AI | Multi-provider abstraction | Avoid vendor lock-in, mock for development, failover |
| Auth | JWT + bcrypt | Stateless, industry standard, refresh rotation |
| Testing | Vitest + Playwright | Fast Vitest, comprehensive Playwright, TypeScript-native |
