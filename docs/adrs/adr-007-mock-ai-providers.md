# ADR-007: Mock AI Providers for Development

**Status:** Accepted

**Date:** 2026-07-18

**Context:** AI features require API keys for real providers, which not all developers have. CI pipelines would incur API costs on every test run. Unit tests need deterministic, reproducible AI responses to assert against. Without a mock layer, development is blocked on external service availability and API quotas.

**Decision:** Implement a Mock AI provider that implements the same interface as real providers. Mock responses are powered by configurable datasets — static JSON fixtures for deterministic scenarios and template-based responses for generative cases. The mock provider is the default in development and test environments.

**Consequences:** Positive — offline development is fully supported without API keys or internet access; CI tests run instantly with zero API costs; mock datasets provide deterministic, reproducible test scenarios; edge cases (rate limits, timeouts, malformed responses) can be reliably simulated. Negative — mock responses may diverge from real provider behavior over time (mitigated by integration test suite against real providers); maintaining comprehensive mock datasets requires ongoing effort; developers may rely on mocks and miss real provider quirks until staging.

**Alternatives Considered:** VCR-style recording (harder to maintain, stores large binary cassettes in repo); mocking at the HTTP layer (fragile, tied to provider SDK internals, harder to simulate edge cases); no mocks (blocks development, incurs API costs, flaky CI).
