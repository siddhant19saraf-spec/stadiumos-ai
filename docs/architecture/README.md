# Architecture Diagrams

Visual reference for StadiumOS AI system architecture.

---

## System Architecture

```mermaid
graph TB
    subgraph "Clients"
        B[Browser — Desktop]
        MB[Browser — Mobile]
    end

    subgraph "CDN / Edge"
        CDN[Vercel CDN]
        EDGE[Edge Functions]
    end

    subgraph "Frontend (Next.js 16)"
        APP[App Router]
        RSC[React Server Components]
        RCC[React Client Components]
        
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

        subgraph "Core"
            RQ[React Query]
            ZS[Zustand]
            WS[WebSocket]
            PF[Performance]
            A11Y[Accessibility]
        end
    end

    subgraph "Backend (FastAPI)"
        API[API Gateway]
        AUTH[Auth + RBAC]
        AI_GW[AI Gateway]
        
        subgraph "Module Routers"
            CR[Crowd Router]
            EM[Emergency Router]
            PK[Parking Router]
            QU[Queue Router]
            MA[Maintenance Router]
            SEC[Security Router]
        end
        
        EB[Event Bus — Redis]
        CACHE[Redis Cache]
        DB[(PostgreSQL)]
        WK[ARQ Workers]
    end

    subgraph "External"
        OAI[OpenAI API]
        GEM[Gemini API]
        WX[Weather API]
        TF[Traffic API]
    end

    B --> CDN
    MB --> CDN
    CDN --> EDGE
    EDGE --> APP
    APP --> RSC
    RSC --> RCC
    
    RCC --> CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU & AL & PC
    CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU & AL & PC --> RQ & ZS & WS
    
    RQ -->|REST| API
    WS -->|WebSocket| EB
    
    API --> AUTH
    API --> AI_GW
    API --> CR & EM & PK & QU & MA & SEC
    
    CR & EM & PK & QU & MA & SEC --> DB
    CR & EM & PK & QU & MA & SEC --> EB
    
    EB --> WK
    
    AI_GW --> OAI
    AI_GW --> GEM
    
    API --> CACHE
    CR & EM & PK & QU & MA & SEC --> CACHE
    
    WX -.-> API
    TF -.-> API
```

---

## Frontend Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        PL[Root Layout]
        DL[Dashboard Layout]
        P[Pages — 14 modules]
        C[Components — shared + feature]
    end

    subgraph "State Layer"
        RQ[TanStack React Query]
        ZS[Zustand — ui-store]
        LS[localStorage — useLocalStorage hook]
        URL[next/navigation — search params]
    end

    subgraph "Service Layer"
        API[ApiClient — HTTP]
        WS[useWebSocket — real-time]
        AUTH[auth-service]
        PM[performance-middleware]
    end

    subgraph "Infrastructure"
        MEM[memoize / async utilities]
        CACHE[CacheStore / withCache]
        DEB[debounce / throttle]
        LAZY[lazyImport / lazyComponent]
        MEAS[measureSync / measureAsync]
    end

    subgraph "Accessibility"
        SKIP[SkipLink]
        ANN[AnnouncerProvider]
        FOC[focus-manager]
        KEY[keyboard-nav]
        MOT[motion — reduced motion]
    end

    PL --> DL
    DL --> P
    P --> C
    
    C --> RQ
    C --> ZS
    C --> URL
    
    RQ --> API
    C --> WS
    C --> AUTH
    
    API --> MEM
    API --> CACHE
    API --> DEB
    API --> LAZY
    
    P --> SKIP
    C --> ANN
    C --> FOC
    C --> KEY
    C --> MOT
```

---

## Backend Architecture

```mermaid
graph TB
    subgraph "API Layer"
        FAST[FastAPI Application]
        COR[CORS Middleware]
        AUTH[Auth Dependency]
        RATE[Rate Limiter]
        LOG[Logging Middleware]
    end

    subgraph "Module Layer"
        CR[Crowd Routes]
        EM[Emergency Routes]
        PK[Parking Routes]
        QU[Queue Routes]
        MA[Maintenance Routes]
        SEC[Security Routes]
        AI[AI Router]
    end

    subgraph "Service Layer"
        SVC[Module Services]
        ENGS[Engines — Analytics, Prediction, Simulation, Recommendation]
        AI_P[AI Providers — Base, OpenAI, Gemini, Mock]
    end

    subgraph "Data Layer"
        DB[SQLAlchemy ORM]
        AL[ALembic Migrations]
        CA[Redis Cache — aiocache]
        EB[Event Bus — Redis pub/sub]
    end

    subgraph "External"
        PG[(PostgreSQL)]
        RD[(Redis)]
        LLM[LLM APIs]
    end

    FAST --> COR
    FAST --> AUTH
    FAST --> RATE
    FAST --> LOG
    
    FAST --> CR & EM & PK & QU & MA & SEC & AI
    
    CR & EM & PK & QU & MA & SEC --> SVC
    AI --> AI_P
    
    SVC --> ENGS
    SVC --> DB
    SVC --> CA
    SVC --> EB
    
    DB --> PG
    CA --> RD
    EB --> RD
    
    AI_P --> LLM
```

---

## Module Dependency Graph

```mermaid
graph LR
    subgraph "Primary Modules"
        CC[Command Center]
        AC[AI Copilot]
        DT[Digital Twin]
        EA[Executive Analytics]
    end

    subgraph "Data Modules"
        CI[Crowd Intelligence]
        QI[Queue Intelligence]
        SP[Smart Parking]
        PM[Predictive Maintenance]
    end

    subgraph "Operations Modules"
        ER[Emergency Response]
        TO[Tournament Ops]
        SU[Sustainability]
    end

    subgraph "Cross-Cutting"
        ES[Enterprise Security]
        PC[Performance Center]
        AL[Accessibility Center]
    end

    CC --> CI
    CC --> ER
    CC --> DT
    CC --> AC
    CC --> QI
    CC --> SP
    CC --> PM
    CC --> TO
    CC --> SU

    EA --> CI
    EA --> ER
    EA --> PM
    EA --> SP
    EA --> QI
    EA --> TO
    EA --> SU

    DT --> CI
    DT --> SP
    DT --> PM

    AC --> CI
    AC --> ER
    AC --> PM
    AC --> SP
    AC --> QI
    AC --> TO

    PC -.->|monitors| CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU
    AL -.->|audits| CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU
    ES -.->|secures| CC & CI & ER & DT & AC & PM & SP & QI & EA & ES & TO & SU
```

---

## Request Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant N as Next.js
    participant RQ as React Query
    participant AC as ApiClient
    participant BE as FastAPI
    participant AU as Auth
    participant SV as Service
    participant DB as Database
    participant CA as Redis Cache

    U->>N: Navigate to /crowd-intelligence
    N->>N: Server-render shell layout
    N-->>U: Initial HTML + JS
    
    U->>U: Page hydrates
    U->>RQ: useQuery('crowd.zones')
    
    RQ->>AC: GET /api/v1/crowd/zones
    AC->>AC: Attach JWT from storage
    
    alt Token expired
        AC->>BE: POST /auth/refresh
        BE-->>AC: New access token
        AC->>AC: Retry with new token
    end
    
    AC->>BE: GET /api/v1/crowd/zones
    BE->>AU: Verify JWT + RBAC
    AU-->>BE: Authorized
    
    BE->>CA: Check cache (crowd:zones)
    alt Cache hit
        CA-->>BE: Cached data
    else Cache miss
        BE->>DB: SELECT * FROM crowd_zones
        DB-->>BE: Zone data
        BE->>CA: Set cache (TTL: 30s)
    end
    
    BE-->>AC: JSON response
    AC-->>RQ: Parsed data
    RQ-->>U: Updated UI
    
    Note over U,RQ: Subsequent requests serve from React Query cache (staleTime: 30s)
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant AC as ApiClient
    participant BE as Backend
    participant DB as Database

    U->>F: Enter credentials
    F->>AC: POST /auth/login
    AC->>BE: POST /auth/login
    BE->>DB: Verify credentials (bcrypt)
    DB-->>BE: User found
    
    BE->>BE: Generate JWT (15min) + refresh token (7d)
    BE-->>AC: { access_token, refresh_token, user }
    AC->>AC: Store tokens (memory + httpOnly cookie)
    AC-->>F: Login success
    F-->>U: Redirect to dashboard

    Note over F,BE: Subsequent API calls
    
    F->>AC: GET /api/v1/crowd/zones
    AC->>AC: Attach access_token
    AC->>BE: Request with JWT
    
    alt Valid token
        BE-->>AC: Response
    else Expired token
        BE-->>AC: 401
        AC->>BE: POST /auth/refresh
        BE-->>AC: New tokens
        AC->>AC: Update stored tokens
        AC->>BE: Retry original request
        BE-->>AC: Response
    end
    
    AC-->>F: Data
```

---

## AI Recommendation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Page Component
    participant RQ as React Query
    participant BE as Backend
    participant EN as Module Engine
    participant AI as AI Gateway
    participant LLM as LLM

    U->>P: Opens module dashboard
    P->>RQ: useQuery('module.recommendations')
    RQ->>BE: GET /api/v1/module/recommendations
    
    BE->>EN: Collect module data + context
    EN-->>BE: Metrics, predictions, status
    
    BE->>BE: Check rule-based triggers
    Note over BE: Critical alerts bypass AI
    
    alt Needs AI analysis
        BE->>AI: Build prompt with context
        AI->>LLM: Generate recommendations
        LLM-->>AI: AI response
        AI-->>BE: Parsed recommendations
    end
    
    BE->>BE: Score + prioritize
    BE->>BE: Cache result (TTL: 60s)
    BE-->>RQ: Recommendation list
    RQ-->>P: Render recommendation panel
    P-->>U: Recommendations visible
```

---

## Emergency Workflow

```mermaid
sequenceDiagram
    participant U as Operator
    participant ER as Emergency Dashboard
    participant BE as Backend
    participant AI as AI Analysis
    participant DP as Dispatch Engine
    participant TM as Response Team

    Note over U,TM: Incident Detection
    
    U->>ER: Report incident (or system detects)
    ER->>BE: POST /emergency/incidents
    BE->>BE: Create incident record
    BE->>AI: Analyze incident
    AI-->>BE: Risk assessment + recommendation
    BE-->>ER: Incident created with AI analysis
    ER-->>U: Incident visible in queue

    Note over U,TM: Dispatch Phase
    
    U->>ER: Click "Dispatch Team"
    ER->>BE: POST /emergency/incidents/{id}/dispatch
    BE->>DP: Find optimal team
    DP->>DP: Check proximity, availability, skills
    DP-->>BE: Recommended team
    BE-->>ER: Team dispatched
    ER->>TM: Send alert (WebSocket)
    TM-->>ER: Acknowledged, en route

    Note over U,TM: Resolution
    
    TM->>BE: Update incident status
    BE-->>ER: Status update (real-time)
    BE->>BE: Log to audit trail
    ER-->>U: Incident resolved
```

---

## Digital Twin Data Flow

```mermaid
graph TB
    subgraph "Frontend"
        DTD[Digital Twin Dashboard]
        SM[Stadium Map — SVG/Canvas]
        LC[Layer Controls]
        TC[Time Travel Controls]
        SC[Simulation Controls]
        ZP[Zone Detail Panel]
    end

    subgraph "Backend"
        DTE[Digital Twin Engine]
        VE[Visualization Engine]
        SE[Simulation Engine]
        PE[Prediction Engine]
        AE[Analytics Engine]
        ME[Map Engine]
        RE[Recommendation Engine]
    end

    subgraph "Data Sources"
        SENSOR[Sensor Data — IoT]
        HIST[Historical Data]
        LIVE[Live Feeds — Crowd, Parking, etc.]
        STAT[Static Venue Data]
    end

    DTD --> DTE
    DTD --> SM
    DTD --> LC
    DTD --> TC
    DTD --> SC
    DTD --> ZP
    
    DTE --> VE & SE & PE & AE & ME & RE
    
    VE --> SM
    SE --> SC
    PE --> TC
    AE --> ZP
    ME --> SM
    RE --> DTD
    
    DTE --> SENSOR
    DTE --> HIST
    DTE --> LIVE
    DTE --> STAT
    
    LC --> VE
    TC --> PE
    SC --> SE
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        
        subgraph "Vercel (Frontend)"
            V_CDN[CDN — Global Edge]
            V_SSR[Serverless Functions — SSR]
            V_STATIC[Static Assets — .next/static]
        end
        
        subgraph "Cloud Run (Backend)"
            CR_API[API Service — 3 instances]
            CR_WS[WebSocket Service — 2 instances]
            CR_WK[Worker Service — 2 instances]
        end
        
        subgraph "Google Cloud"
            SQL[Cloud SQL — PostgreSQL]
            RM[Cloud Memorystore — Redis]
            CR[Container Registry]
        end
        
        subgraph "Monitoring"
            CL[Cloud Logging]
            CM[Cloud Monitoring]
            SE[Sentry — Error Tracking]
        end
        
        subgraph "External"
            DNS[DNS — Cloudflare]
            OAI[OpenAI API]
            GEM[Gemini API]
        end
        
        DNS --> V_CDN
        V_CDN --> V_SSR
        V_CDN --> V_STATIC
        
        V_SSR --> CR_API
        CR_API --> SQL
        CR_API --> RM
        CR_API --> OAI
        CR_API --> GEM
        
        CR_WS --> RM
        CR_WK --> RM
        
        CR_API --> CL
        CR_WS --> CL
        CR_WK --> CL
        
        V_SSR --> SE
        CR_API --> SE
        
        CM --> CR_API & CR_WS & CR_WK & SQL & RM
    end

    subgraph "CI/CD"
        GH[GitHub]
        GA[GitHub Actions — 12 jobs]
        GCR[Container Registry]
    end

    GH --> GA
    GA --> GCR
    GCR --> CR_API & CR_WS & CR_WK
    GA --> Vercel[Vercel Deploy Hook]
    Vercel --> V_SSR & V_STATIC
```

---

## Performance Architecture

```mermaid
graph LR
    subgraph "Frontend Caching"
        RQC[React Query Cache — staleTime: 30s]
        MEM[memoize / memoizeAsync]
        DEB[debounce / throttle]
        VIRT[React Virtual — 10-row window]
        LAZY[lazyComponent — code splitting]
    end

    subgraph "Backend Caching"
        RC[Redis Cache — TTL: 5min]
        CP[Connection Pool — SQLAlchemy]
        BC[Batch Processing — createBatchProcessor]
        AQ[Async Queue — createAsyncQueue: concurrency 5]
    end

    subgraph "Monitoring"
        PM[Performance Monitor]
        WV[Web Vitals — LCP, INP, CLS]
        LT[Latency Tracking — p50, p95, p99]
    end

    RQC --> PM
    MEM --> PM
    DEB --> PM
    VIRT --> PM
    LAZY --> PM
    
    RC --> PM
    CP --> PM
    BC --> PM
    AQ --> PM
    
    PM --> WV
    PM --> LT
```

## Accessibility Architecture

```mermaid
graph TB
    subgraph "Infrastructure (lib/a11y/)"
        SKIP[SkipLink — Skip to main content]
        ANN[AnnouncerProvider — Screen reader announcements]
        FOC[Focus Manager — Trap, scope, restore]
        KEY[Keyboard Nav — useEscape, useArrowNavigation, useShortcut]
        MOT[Motion — prefers-reduced-motion detection]
    end

    subgraph "Components (components/a11y/)"
        DIALOG[AccessibleDialog — aria-modal, focus trap, Escape dismiss]
        TABLE[AccessibleTable — sortable columns, aria-sort, caption]
        TOAST[ToastContainer — aria-live region, role=status]
        LOAD[Loading — spinner, dots, skeleton with role=status]
        SRO[SrOnly / VisuallyHidden — screen reader only text]
    end

    subgraph "Monitoring (features/a11y-center/)"
        DASH[A11y Dashboard — Score gauges, issue tracker]
        WCAG[WCAG 2.2 AA — 25 criteria tracked]
        AUDIT[Issue management — 15 issue templates, modules scored]
    end

    subgraph "Integration"
        LAYOUT[Root Layout — SkipLink at top]
        PROVIDER[Providers — AnnouncerProvider wraps app]
        BADGE[Badge — role=status, aria-label]
        ERROR[ErrorBoundary — aria-live=assertive]
        EMPTY[EmptyState — aria-label on status region]
        TABLE_T[Tables — accessible sortable pattern]
    end

    LAYOUT --> SKIP
    PROVIDER --> ANN
    DIALOG --> FOC
    DIALOG --> KEY
    TOAST --> ANN
    LOAD --> MOT

    DASH --> WCAG
    DASH --> AUDIT
    WCAG --> BADGE & ERROR & EMPTY & TABLE_T & DIALOG & TOAST & LOAD
```
