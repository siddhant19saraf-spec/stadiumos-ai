# ADR-005: Zustand for Client State

**Status:** Accepted

**Date:** 2026-07-18

**Context:** The application has UI-specific client state that is not server-owned — sidebar visibility, theme preferences, selected dashboard filters, multi-step form data, and real-time notification settings. Redux was considered but introduces significant boilerplate (actions, reducers, middleware) for what is largely ephemeral UI state.

**Decision:** Use Zustand for all client-side state management. Stores will be small, focused, and colocated with their feature slices. The persist middleware will handle hydration for user preferences.

**Consequences:** Positive — minimal boilerplate compared to Redux (no actions, reducers, or dispatch types); built-in persist middleware handles localStorage hydration without additional libraries; TypeScript-native with excellent type inference; ~1KB bundle size; works outside React (useful for utility modules and service workers). Negative — no built-in devtools (added via middleware); no enforcement of state immutability (team convention required); ecosystem of plugins is smaller than Redux; large stores can become disorganized without discipline.

**Alternatives Considered:** Redux Toolkit (heavier ~11KB, more boilerplate, powerful middleware ecosystem but overkill for current needs); Jotai (atomic model, less familiar to the team, more granular than needed); context + useReducer (built-in but causes unnecessary re-renders, no persistence, no devtools).
