# ADR-003: Feature-Sliced Architecture

**Status:** Accepted

**Date:** 2026-07-18

**Context:** The codebase will span multiple domains — venue management, event scheduling, ticketing, analytics, user administration, and AI-powered features. A monolithic structure would create tight coupling, merge conflicts, and unclear ownership. The architecture must scale with team growth and support parallel feature development.

**Decision:** Organize the frontend and backend codebases using Feature-Sliced Architecture (vertical slices). Each domain is a self-contained slice containing its own types, services, components, API handlers, database models, and tests. Cross-cutting concerns (auth, logging, telemetry) live in shared layers consumed by all slices.

**Consequences:** Positive — teams can develop and deploy features independently with clear ownership boundaries; slice boundaries enforce separation of concerns at the filesystem level; new developers can understand a single slice without reading the entire codebase; slices can be extracted into micro-frontends or micro-services if needed. Negative — some code duplication across slices is inevitable (mitigated by shared layer); refactoring cross-cutting changes requires touching every slice; feature boundaries must be actively maintained to prevent creep.

**Alternatives Considered:** Layered architecture (models, views, controllers as top-level folders — leads to cross-domain coupling); micro-frontends (premature complexity, operational overhead); monorepo with packages (similar isolation but higher initial setup cost).
