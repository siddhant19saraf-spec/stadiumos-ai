# Project Structure

Complete directory reference for the StadiumOS AI monorepo.

---

## Root

```
stadiumos-ai/
├── README.md                       # Project overview and quick start
├── ARCHITECTURE.md                 # System architecture documentation
├── CHANGELOG.md                    # Version history and release notes
├── CONTRIBUTING.md                 # Contribution guidelines
├── SECURITY.md                     # Security policy and disclosure
├── .editorconfig                   # Editor configuration
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── docker-compose.yml              # Infrastructure orchestration
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Main CI pipeline
│       └── quality-gates.yml       # Multistage quality gates
├── .husky/
│   └── pre-commit                  # Lint-staged pre-commit hook
├── frontend/                       # Next.js 16 application
├── backend/                        # FastAPI application
├── docs/                           # Documentation
└── infra/                          # Infrastructure configs
    ├── k8s/                        # Kubernetes manifests (empty)
    └── nginx/                      # Nginx configs (empty)
```

---

## Frontend (`frontend/`)

```
frontend/
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier formatting rules
├── Dockerfile                      # Multi-stage Docker build
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── pnpm-lock.yaml                  # Lockfile (committed)
├── pnpm-workspace.yaml             # pnpm workspace config
├── postcss.config.js               # PostCSS (Tailwind + Autoprefixer)
├── tailwind.config.ts              # Tailwind theme and content paths
├── tsconfig.json                   # TypeScript strict mode config
├── vitest.config.ts                # Vitest test configuration
├── PERFORMANCE_AUDIT.md            # Performance audit report
├── TESTING_GUIDE.md                # Testing architecture guide
├── tests/                          # All test files
│   ├── setup.ts                    # Test environment setup (jest-dom, mocks)
│   ├── fixtures/
│   │   ├── index.ts                # Re-exports
│   │   ├── factories.ts            # 40+ type-safe factory functions
│   │   ├── mocks.ts                # Mock implementations (fetch, IO, localStorage, etc.)
│   │   └── test-utils.ts           # Custom test assertions and utilities
│   ├── unit/                       # 13 module-level unit test files
│   ├── integration/                # Cross-module integration tests
│   ├── e2e/                        # Playwright E2E user journey tests
│   ├── security/                   # RBAC, auth, injection security tests
│   ├── accessibility/              # WCAG 2.2 AA compliance tests
│   ├── performance/                # Performance benchmarks and load tests
│   ├── ai-validation/              # AI recommendation quality tests
│   └── error-handling/             # Error and edge case tests
│
└── src/
    ├── app/                        # Next.js App Router pages
    │   ├── layout.tsx              # Root layout (fonts, providers, skip link)
    │   ├── providers.tsx           # Session, Query, Theme, Announcer providers
    │   ├── (auth)/                 # Auth-optional route group
    │   │   ├── layout.tsx          # Centered card layout
    │   │   ├── login/page.tsx      # Login form
    │   │   └── register/page.tsx   # Registration (placeholder)
    │   └── (dashboard)/            # Protected dashboard route group
    │       ├── layout.tsx          # Shell (Sidebar + Header + Main)
    │       ├── loading.tsx         # Dashboard loading state
    │       ├── error.tsx           # Dashboard error boundary
    │       ├── page.tsx →          # Redirects to /command-center
    │       ├── command-center/
    │       ├── ai-copilot/
    │       ├── crowd-intelligence/
    │       ├── digital-twin/
    │       ├── emergency-response/
    │       ├── enterprise-security/
    │       ├── executive-analytics/
    │       ├── maintenance/        # Predictive Maintenance
    │       ├── parking/            # Smart Parking
    │       ├── queue-intelligence/
    │       ├── scheduling/         # Tournament Operations
    │       ├── sustainability/     # Energy
    │       ├── fan-assistant/
    │       ├── incidents/
    │       ├── staff-allocation/
    │       ├── qa-dashboard/
    │       ├── a11y-center/        # Accessibility Center
    │       ├── performance/        # Performance Center
    │       └── energy/             # Sustainability (alternate route)
    │
    ├── components/                 # Shared UI components
    │   ├── a11y/                   # Accessibility components
    │   │   ├── index.ts            # Re-exports
    │   │   ├── accessible-dialog.tsx
    │   │   ├── accessible-table.tsx
    │   │   ├── loading.tsx         # LoadingSpinner, LoadingDots, LoadingSkeleton
    │   │   ├── sr-only.tsx         # SrOnly, VisuallyHidden
    │   │   └── toast.tsx           # ToastContainer, showToast
    │   ├── charts/                 # Chart wrappers
    │   │   ├── area-chart.tsx      # Recharts AreaChart
    │   │   └── bar-chart.tsx       # Recharts BarChart
    │   ├── layout/                 # Layout components
    │   │   ├── shell.tsx           # App shell orchestrator
    │   │   ├── sidebar.tsx         # Navigation sidebar (collapsible)
    │   │   └── header.tsx          # Top header (theme, user menu)
    │   ├── ui/                     # UI primitives
    │   │   ├── avatar.tsx          # Avatar component
    │   │   ├── badge.tsx           # Badge variants
    │   │   ├── button.tsx          # Button (CVA variants)
    │   │   ├── card.tsx            # Card with sub-components
    │   │   ├── dropdown-menu.tsx   # Radix dropdown menu
    │   │   ├── input.tsx           # Form input
    │   │   ├── label.tsx           # Form label
    │   │   ├── progress.tsx        # Progress bar
    │   │   ├── sheet.tsx           # Slide-over panel
    │   │   └── toast.tsx           # shadcn-style toast
    │   ├── empty-state.tsx         # Empty state display
    │   ├── error-boundary.tsx      # Error boundary with retry
    │   ├── error-fallback.tsx      # Error fallback UI
    │   ├── loading.tsx             # Loading states (page, card, grid)
    │   └── theme-provider.tsx      # next-themes wrapper
    │
    ├── constants/                  # App-wide constants
    │   ├── index.ts                # APP_NAME, CACHE, PAGINATION, THEME, WEBSOCKET
    │   └── modules.ts              # MODULES (18 definitions), MODULE_CATEGORIES (5)
    │
    ├── features/                   # Domain feature modules (14)
    │   ├── command-center/         # Unified operational dashboard
    │   ├── ai-copilot/             # AI-powered operational assistant
    │   ├── crowd-intelligence/     # Zone monitoring and crowd prediction
    │   ├── digital-twin/           # 3D venue visualization
    │   ├── emergency-response/     # Incident management and dispatch
    │   ├── enterprise-security/    # RBAC, audit, compliance
    │   ├── executive-analytics/    # Cross-module KPIs and reporting
    │   ├── predictive-maintenance/ # Asset health and failure prediction
    │   ├── smart-parking/          # Parking lot management
    │   ├── queue-intelligence/     # Concession queue optimization
    │   ├── tournament-ops/         # Event scheduling and operations
    │   ├── sustainability/         # Energy, water, waste monitoring
    │   ├── qa-dashboard/           # Quality assurance metrics
    │   ├── a11y-center/            # Accessibility compliance
    │   └── performance-center/     # Performance monitoring
    │
    ├── hooks/                      # Custom React hooks
    │   ├── use-debounce.ts         # Debounced value
    │   ├── use-local-storage.ts    # localStorage with cross-tab sync
    │   ├── use-media-query.ts      # Reactive CSS media queries
    │   ├── use-toast.ts            # Toast notification system
    │   └── use-websocket.ts        # WebSocket with auto-reconnect
    │
    ├── lib/                        # Core utilities
    │   ├── a11y/                   # Accessibility utilities
    │   │   ├── index.ts
    │   │   ├── announcer.tsx       # AnnouncerProvider, useAnnouncer
    │   │   ├── focus-manager.ts    # Focus trapping and scoping
    │   │   ├── keyboard-nav.ts     # Keyboard navigation hooks
    │   │   ├── motion.ts           # Reduced motion preferences
    │   │   └── skip-link.tsx       # Skip navigation component
    │   ├── performance/            # Performance utilities
    │   │   ├── index.ts
    │   │   ├── async.ts            # AsyncQueue, BatchProcessor, RetryStrategy
    │   │   ├── cache.ts            # CacheStore, withCache
    │   │   ├── debounce.ts         # debounce, throttle, rafThrottle
    │   │   ├── lazy.ts             # lazyImport, lazyComponent
    │   │   ├── measure.ts          # measureSync, measureAsync
    │   │   ├── memoize.ts          # memoize, memoizeAsync, deepMemoize
    │   │   ├── storage-cache.ts    # Memory/Session/Local storage cache
    │   │   └── suspense.tsx        # SuspenseFallback, createSuspenseWrapper
    │   ├── api-client.ts           # HTTP client with auth, retry, pagination
    │   ├── auth.ts                 # next-auth config, role helpers
    │   ├── error-handler.ts        # AppError class, ErrorCode enum
    │   ├── logger.ts               # Structured Logger (debug/info/warn/error)
    │   ├── response-wrapper.ts     # ApiResponse, ApiError builders
    │   └── utils.ts                # cn(), formatDate, debounce, generateId, etc.
    │
    ├── middleware/                 # Middleware
    │   └── performance-middleware.ts # API, page, AI response timing
    │
    ├── services/                   # Global services
    │   ├── auth-service.ts         # Login/register/logout/refresh API calls
    │   └── performance-monitor.ts  # Metrics recording, summary, health checks
    │
    ├── stores/                     # Zustand stores
    │   └── ui-store.ts             # Theme, sidebar, active module, mobile menu
    │
    ├── styles/
    │   └── globals.css             # Tailwind directives and CSS variables
    │
    ├── types/                      # Global TypeScript types
    │   ├── api.ts                  # ApiResponse, ApiError, PaginationInfo
    │   ├── common.ts              # Severity, Status, BaseEntity, Coordinate
    │   └── modules.ts             # Alert, AILog, User, ModuleDefinition
    │
    └── utils/                      # (Empty — utilities are in lib/)
```

---

## Backend (`backend/`)

```
backend/
├── Dockerfile                      # Multi-stage Docker build
├── requirements.txt                # Production dependencies
├── requirements-dev.txt            # Development dependencies
├── alembic.ini                     # Alembic configuration
├── pyproject.toml                  # Ruff, Black, Mypy settings
├── alembic/
│   ├── env.py                      # Alembic environment configuration
│   └── script.py.mako              # Migration template
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app: CORS, lifespan, health, routers
│   ├── core/                       # Core framework
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic Settings (all env vars)
│   │   ├── database.py             # Async SQLAlchemy engine + session
│   │   ├── dependencies.py         # FastAPI dependency injection
│   │   ├── errors.py               # Exception handlers
│   │   ├── cache.py                # Redis cache setup
│   │   ├── event_bus.py            # Redis pub/sub event bus
│   │   ├── logging.py              # Logging configuration
│   │   └── security.py             # JWT, password hashing, CORS
│   ├── ai/                         # AI provider abstraction
│   │   ├── __init__.py
│   │   ├── base.py                 # Abstract AIProvider interface
│   │   ├── gemini_provider.py      # Google Gemini implementation
│   │   ├── openai_provider.py      # OpenAI implementation
│   │   └── router.py               # AI gateway router
│   ├── modules/                    # Backend modules
│   │   ├── __init__.py
│   │   └── crowd/                  # Example: Crowd module
│   │       ├── __init__.py
│   │       ├── models.py           # Pydantic request/response models
│   │       ├── db_models.py        # SQLAlchemy ORM models
│   │       ├── router.py           # FastAPI route definitions
│   │       └── service.py          # Business logic
│   └── lib/                        # Shared utilities
│       ├── __init__.py
│       ├── pagination.py           # Pagination helper
│       └── response.py             # Standardized response format
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Async test fixtures (SQLite in-memory)
│   └── test_health.py              # Health endpoint tests
└── workers/                        # Background workers (empty, future ARQ)
```

---

## Documentation (`docs/`)

```
docs/
├── README.md                       # Documentation index
├── architecture/
│   └── README.md                   # Architecture diagrams (Mermaid)
├── adrs/
│   ├── adr-001-nextjs-frontend.md
│   ├── adr-002-fastapi-backend.md
│   ├── adr-003-feature-sliced-architecture.md
│   ├── adr-004-tanstack-query.md
│   ├── adr-005-zustand-client-state.md
│   ├── adr-006-multi-provider-ai-abstraction.md
│   ├── adr-007-mock-ai-providers.md
│   ├── adr-008-digital-twin-layered-architecture.md
│   ├── adr-009-jwt-refresh-token-auth.md
│   └── adr-010-typescript-strict-mode.md
├── runbooks/
│   ├── application-startup.md
│   ├── deployment.md
│   ├── rollback.md
│   ├── database-migration.md
│   ├── incident-response.md
│   ├── log-investigation.md
│   ├── performance-troubleshooting.md
│   └── security-incident.md
├── guides/
│   ├── developer-guide.md          # Onboarding and daily reference
│   ├── operations.md               # Operations manual
│   ├── configuration.md            # Configuration reference
│   ├── quality.md                  # Quality documentation
│   ├── deployment.md               # Deployment guide
│   ├── ai.md                       # AI architecture guide
│   ├── api-reference.md            # API reference
│   └── project-structure.md        # This file
├── quality-report.md               # Documentation quality report
└── README.md                       # Docs index (this)
```
