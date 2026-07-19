# ADR-006: Multi-Provider AI Abstraction

**Status:** Accepted

**Date:** 2026-07-18

**Context:** StadiumOS will leverage AI for venue analytics, predictive maintenance, automated event summaries, and chatbot interactions. Building directly against a single provider (e.g., OpenAI) creates vendor lock-in and prevents local development without API keys. The architecture must support multiple AI providers with minimal code changes and graceful failover.

**Decision:** Define a provider-agnostic AI interface using an abstract base class (or Protocol) that all providers implement. The first-class providers will be OpenAI, Google Gemini, and a Mock provider. Providers are selected via environment configuration at startup, with support for runtime failover.

**Consequences:** Positive — vendor lock-in is eliminated; any provider can be swapped without changing business logic; mock provider enables offline development and CI testing; failover between providers increases resilience; new providers (Anthropic, local models) can be added by implementing the interface. Negative — abstraction layer must accommodate the lowest common denominator of provider capabilities; provider-specific features (Gemini function calling nuances, OpenAI structured outputs) may require conditional logic; additional testing surface for each provider implementation.

**Alternatives Considered:** Direct OpenAI integration (fastest initial velocity but creates lock-in and blocks offline development); LangChain (heavy abstraction with frequent breaking changes, over-engineered for current use cases); custom provider per feature (duplication, inconsistent behavior across features).
