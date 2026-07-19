# ADR-009: JWT + Refresh Token Authentication

**Status:** Accepted

**Date:** 2026-07-18

**Context:** StadiumOS requires authentication for administrators, venue staff, and API consumers. The system must scale horizontally across multiple backend instances without shared session state. Security requirements include short-lived access tokens to limit exposure from token theft and refresh token rotation to detect and prevent replay attacks.

**Decision:** Implement a dual-token JWT strategy. Access tokens (15-minute expiry) carry user claims and are signed with RS256. Refresh tokens (7-day expiry) are stored in httpOnly, Secure, SameSite=Strict cookies with rotation — each refresh invalidates the previous refresh token. The backend validates tokens using public key cryptography, enabling stateless verification across instances.

**Consequences:** Positive — fully stateless access token verification enables horizontal scaling without a session store; short-lived access tokens limit the blast radius of token leakage; refresh token rotation detects stolen tokens when an already-rotated token is reused; httpOnly cookies prevent XSS-based token exfiltration. Negative — refresh token rotation requires a database or Redis to track the current valid token; revoked users remain authenticated until their short-lived access token expires; mobile clients require custom token storage rather than relying on cookies alone; token lifecycle management adds complexity to the auth flow.

**Alternatives Considered:** Session-based auth with Redis (stateful, adds Redis dependency, more complex scaling); single long-lived JWT (no rotation, higher risk from token theft); OAuth2 with external provider (added dependency, slower development velocity for initial release); opaque API keys (no built-in identity propagation, harder to revoke selectively).
