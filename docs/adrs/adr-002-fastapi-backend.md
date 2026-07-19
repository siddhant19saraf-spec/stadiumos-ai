# ADR-002: FastAPI as Backend Framework

**Status:** Accepted

**Date:** 2026-07-18

**Context:** The backend must serve a REST API with automatic OpenAPI documentation, support asynchronous database operations for stadium event streams, and provide robust request validation. The team has significant Python experience and prefers a framework with strong typing and autocompletion support.

**Decision:** Use FastAPI as the primary backend framework. All API endpoints will be async, Pydantic models will define request/response schemas, and async SQLAlchemy will handle database interactions.

**Consequences:** Positive — Pydantic validation auto-generates OpenAPI 3.1 specs, eliminating manual API documentation; async-native architecture handles concurrent WebSocket connections for live stadium data; mature ecosystem with well-maintained extensions for auth, caching, and background tasks; benchmark performance rivals Node.js and Go frameworks. Negative — async Python debugging is more challenging than synchronous code; GIL limits CPU-bound workloads within request handlers (mitigated by offloading to background workers); smaller middleware ecosystem compared to Django.

**Alternatives Considered:** Django + Django REST Framework (more opinionated, heavier, synchronous by default); Express.js (different language, no built-in validation or OpenAPI); Go with Gin (steeper learning curve for team, more boilerplate for data validation).
