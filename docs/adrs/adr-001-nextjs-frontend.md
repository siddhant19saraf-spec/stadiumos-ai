# ADR-001: Next.js 16 as Frontend Framework

**Status:** Accepted

**Date:** 2026-07-18

**Context:** StadiumOS requires a modern, performant frontend capable of rendering real-time stadium data, analytics dashboards, and administrative interfaces. The framework must support server-side rendering for SEO on public pages, static generation for marketing content, and incremental static regeneration for frequently updating data. The team is already proficient in TypeScript and React.

**Decision:** Adopt Next.js 16 as the frontend framework, using the App Router with route groups for logical page organization. Pages will default to React Server Components, with client components used only where interactivity is needed (forms, live charts, real-time updates).

**Consequences:** Positive — SSR/SSG/ISR out of the box supports all rendering patterns; Vercel-native deployment simplifies CI/CD; large ecosystem and community support accelerate development; App Router provides nested layouts and loading states. Negative — couples deployment to Vercel for optimal ISR performance; Server Components introduce a learning curve for team members unfamiliar with the mental model; bundle analysis is more complex with mixed server/client component trees.

**Alternatives Considered:** Remix (similar SSR model but smaller ecosystem, fewer ISR capabilities); SvelteKit (less team familiarity, smaller hiring pool); plain Vite + React (no SSR/SSG without additional tooling, more manual configuration).
