# ADR-010: TypeScript Strict Mode

**Status:** Accepted

**Date:** 2026-07-18

**Context:** The frontend codebase will grow to tens of thousands of lines across multiple feature teams. Runtime errors from null/undefined access, incorrect array indexing, and loose type coercion are a significant source of production bugs in JavaScript applications. The project needs maximum type safety to catch these errors at compile time rather than runtime.

**Decision:** Enable `strict: true` in `tsconfig.json`, which enables `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `noImplicitAny`, `noImplicitThis`, and `alwaysStrict`. Additionally enable `noUncheckedIndexedAccess` to require explicit undefined checks when accessing arrays and indexed types. The `exactOptionalPropertyTypes` flag will also be enabled. These settings are enforced in CI and cannot be overridden per-file.

**Consequences:** Positive — null/undefined access errors are caught at compile time rather than causing runtime crashes; `noUncheckedIndexedAccess` prevents common array-out-of-bounds bugs; improved IDE autocompletion and refactoring safety; type-checking acts as living documentation for function contracts; new team members receive immediate feedback on type correctness. Negative — initial migration effort for existing code (not applicable — greenfield project); some third-party libraries may lack complete type definitions requiring `@types` packages or declaration files; generic-heavy code can become verbose; team must learn advanced TypeScript patterns (type guards, assertion functions, branded types).

**Alternatives Considered:** `strict: false` with individual flags (increased risk of common bugs, inconsistent enforcement across the team); `strict: true` without `noUncheckedIndexedAccess` (still allows silent undefined array access); Flow type checker (smaller ecosystem, less community support, fewer IDE integrations).
