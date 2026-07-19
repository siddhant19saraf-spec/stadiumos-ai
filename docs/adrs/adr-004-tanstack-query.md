# ADR-004: TanStack React Query for Server State

**Status:** Accepted

**Date:** 2026-07-18

**Context:** The frontend must fetch, cache, and synchronize server data from the FastAPI backend — stadium sensor readings, event schedules, ticket availability, and user profiles. Managing loading, error, and stale states manually leads to repetitive boilerplate and inconsistent UX. A dedicated server-state management solution is needed.

**Decision:** Use TanStack React Query (React Query v5) for all server-state operations. API calls will be defined as query keys and mutations with explicit cache invalidation strategies. Stale-while-revalidate will be the default caching policy.

**Consequences:** Positive — automatic caching eliminates manual state synchronization; background refetching keeps dashboards current without polling; built-in pagination, infinite queries, and optimistic updates cover all UI patterns; devtools aid debugging during development; query key conventions provide a predictable caching model across the team. Negative — adds ~12KB to the bundle; caching layer can mask stale data if invalidation is misconfigured; team must learn the query/mutation mental model and key hierarchy conventions.

**Alternatives Considered:** SWR (similar API but smaller ecosystem, less mature devtools); Apollo Client (tied to GraphQL — not using GraphQL); plain fetch with useState/useEffect (high boilerplate, no caching, error-prone race conditions).
