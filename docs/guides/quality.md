# Quality Documentation

Testing strategy, benchmarking guides, and quality checklists for StadiumOS AI.

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Coverage Report Template](#coverage-report-template)
3. [Performance Benchmark Guide](#performance-benchmark-guide)
4. [Accessibility Guide](#accessibility-guide)
5. [Security Checklist](#security-checklist)
6. [Release Checklist](#release-checklist)

---

## Testing Strategy

### Test Pyramid

```
           ╱╲
          ╱ E2E ╲           ~20 tests — Critical user journeys
         ╱────────╲
        ╱Integration╲       ~50 tests — Cross-module workflows
       ╱──────────────╲
      ╱   Unit Tests    ╲   ~1,900 tests — Module engines, services, components
     ╱────────────────────╲
    ╱ Static Analysis ╱ Type Checking ╱ Linting ╱ Formatting ╱ Security Scanning
```

### Test Dimensions (8 total)

| Dimension | Location | Purpose | CI Stage |
|-----------|----------|---------|----------|
| Unit | `src/features/*/__tests__/` | Verify module engines, services, components | `unit-tests` |
| Integration | `tests/integration/` | Verify cross-module data flow | `integration-tests` |
| E2E | `tests/e2e/` | Verify critical user journeys | `e2e-tests` |
| Security | `tests/security/` | Verify RBAC, auth, injection prevention | `security-tests` |
| Accessibility | `tests/accessibility/` | Verify WCAG 2.2 AA compliance | `accessibility-tests` |
| Performance | `tests/performance/` | Verify response times, benchmarks | `performance-tests` |
| AI Validation | `tests/ai-validation/` | Verify AI recommendation quality | `ai-validation-tests` |
| Error Handling | `tests/error-handling/` | Verify graceful failure modes | `error-handling-tests` |

### Test Requirements

| Requirement | Rule |
|-------------|------|
| New features | Must include unit tests for all engines |
| Bug fixes | Must include a test that reproduces the bug |
| Coverage | 80% lines, 80% functions, 75% branches, 80% statements |
| Flakiness | Tests must be deterministic (no random failures) |
| Speed | Full suite must complete in < 10 minutes |
| Isolation | Tests must not depend on each other |

### What to Test

**Test:**
- Engine outputs for given inputs
- Component rendering for all states (loading, empty, error, success)
- Error handling and edge cases
- Accessibility (ARIA roles, keyboard navigation, focus management)
- Performance characteristics (response times, render counts)

**Don't Test:**
- Third-party library internals
- CSS styling (unless it affects accessibility)
- Configuration values (test the behavior, not the value)
- TypeScript types (the compiler checks those)

---

## Coverage Report Template

```markdown
# Coverage Report — v0.1.0 — 2026-07-18

## Summary
- Lines: 82.3% (target: 80%)
- Functions: 81.1% (target: 80%)
- Branches: 76.8% (target: 75%)
- Statements: 82.5% (target: 80%)

## Module Coverage
| Module | Lines | Functions | Branches | Status |
|--------|-------|-----------|----------|--------|
| command-center | 85% | 83% | 78% | ✅ |
| crowd-intelligence | 88% | 86% | 80% | ✅ |
| emergency-response | 84% | 82% | 76% | ✅ |
| queue-intelligence | 90% | 88% | 82% | ✅ |
| smart-parking | 87% | 85% | 79% | ✅ |
| predictive-maintenance | 83% | 81% | 75% | ✅ |
| executive-analytics | 80% | 80% | 74% | ⚠️ |
| digital-twin | 82% | 80% | 76% | ✅ |
| ai-copilot | 78% | 76% | 72% | ⚠️ |
| a11y-center | 100% | 100% | 100% | ✅ |

## Low Coverage Areas
- ai-copilot: AI provider integration paths not fully covered
- executive-analytics: Some report generation paths untested

## Recommendations
1. Add integration tests for AI provider fallback scenarios
2. Cover executive report generation edge cases
3. Maintain a11y-center coverage above 90%
```

---

## Performance Benchmark Guide

### Benchmark Categories

| Category | Metric | Target | Tool |
|----------|--------|--------|------|
| Frontend load | LCP | < 2.5s | Web Vitals / Lighthouse |
| Frontend interaction | INP | < 200ms | Web Vitals |
| Frontend layout | CLS | < 0.1 | Web Vitals |
| API response (p50) | Latency | < 100ms | Performance Monitor |
| API response (p95) | Latency | < 500ms | Performance Monitor |
| Database query | Query time | < 50ms | SQLAlchemy logging |
| AI generation | Response time | < 3s | Performance Monitor |
| Cache hit rate | Hit ratio | > 80% | Redis INFO |

### Running Benchmarks

```bash
# Frontend benchmarks
cd frontend
pnpm test -- tests/performance/performance-benchmarks.test.ts

# With performance monitor
pnpm dev -- --experimental-http2
```

### Benchmark Test Patterns

```typescript
import { describe, it, expect } from "vitest";

describe("Performance Benchmarks", () => {
  it("memoize is faster than raw computation", () => {
    const { measureSync } = require("@/lib/performance/measure");
    
    const { durationMs: rawTime } = measureSync("raw", () => {
      for (let i = 0; i < 100000; i++) expensiveComputation(i);
    });
    
    const { durationMs: memoTime } = measureSync("memo", () => {
      const memoized = memoize(expensiveComputation);
      for (let i = 0; i < 100000; i++) memoized(i);
    });
    
    expect(memoTime).toBeLessThan(rawTime);
  });
});
```

### Profiling Guidelines

1. Always benchmark against the production build
2. Run benchmarks 3 times and take the median
3. Isolate the component/system being benchmarked
4. Disable browser extensions during frontend benchmarks
5. Document the environment (CPU, memory, network)

---

## Accessibility Guide

### WCAG 2.2 AA Compliance

| Criteria | Description | Implementation |
|----------|-------------|----------------|
| 1.1.1 | Non-text Content | All icons have `aria-hidden` or accessible labels |
| 1.4.1 | Use of Color | Status not conveyed by color alone |
| 1.4.3 | Contrast Minimum | 4.5:1 text, 3:1 large text |
| 1.4.4 | Resize Text | No loss at 200% zoom |
| 1.4.10 | Reflow | Content works at 320px width |
| 1.4.11 | Non-text Contrast | UI components at 3:1 |
| 1.4.12 | Text Spacing | No loss with adjusted spacing |
| 2.1.1 | Keyboard | All functionality keyboard accessible |
| 2.1.2 | No Keyboard Trap | Focus can move away from any component |
| 2.4.1 | Bypass Blocks | Skip link on every page |
| 2.4.3 | Focus Order | Logical tab order |
| 2.4.7 | Focus Visible | Visible focus indicator on all interactive elements |
| 2.4.11 | Focus Not Obscured | Focus not hidden by other elements |
| 2.4.12 | Focus Appearance | Focus indicator has sufficient size and contrast |
| 2.5.3 | Label in Name | Accessible name includes visible text |
| 3.3.2 | Labels or Instructions | All inputs have labels |
| 4.1.2 | Name, Role, Value | Custom controls have proper ARIA |
| 4.1.3 | Status Messages | Live regions for dynamic content |

### Accessibility Testing

```bash
# Automated accessibility tests
pnpm test -- tests/accessibility/a11y-testing.test.ts

# A11y Center (live dashboard)
open http://localhost:3000/a11y-center
```

### Manual Testing

1. Navigate the entire app using only the keyboard (Tab, Enter, Escape, Arrow keys)
2. Test with a screen reader (NVDA on Windows, VoiceOver on macOS)
3. Zoom to 200% and verify no content loss
4. Enable reduced motion in OS settings and verify animations
5. Test in high contrast mode (Windows High Contrast, macOS Increase Contrast)

### Common A11y Issues to Avoid

- Buttons without accessible labels
- Color-only status indicators
- Missing focus indicators
- Keyboard traps in modals/dialogs
- Dynamic content changes without announcements
- Low contrast text
- Missing form labels

---

## Security Checklist

### Pre-Release

- [ ] All API endpoints require authentication
- [ ] CORS allowlist includes only production origins
- [ ] Rate limiting configured on auth and public endpoints
- [ ] JWT rotation mechanism verified
- [ ] SQL injection vectors reviewed (ORMs used throughout)
- [ ] XSS vectors reviewed (React auto-escapes, but verify `dangerouslySetInnerHTML`)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Dependencies scanned (`npm audit`, `safety check`)
- [ ] Secrets verified absent from codebase
- [ ] Audit logging enabled for sensitive operations
- [ ] File upload size/type restrictions (future)
- [ ] API rate limit headers exposed (`X-RateLimit-*`)

### CI/CD Security Gates

| Gate | Tool | Failure Threshold |
|------|------|-------------------|
| Dependency audit | `npm audit` | Any high/ critical |
| Python security scan | `bandit` | Any high severity |
| Dependency safety | `safety check` | Any known vulnerability |
| SAST | `eslint-plugin-security` | Any rule violation |
| Secrets scanning | GitLeaks (future) | Any detected secret |

---

## Release Checklist

### Pre-Release

- [ ] All tests pass (8 dimensions)
- [ ] Coverage meets thresholds (80/80/75/80)
- [ ] TypeScript type check passes (frontend)
- [ ] MyPy type check passes (backend)
- [ ] ESLint + Ruff pass with no errors
- [ ] Security scan passes
- [ ] Performance benchmarks within targets
- [ ] Accessibility tests pass
- [ ] CHANGELOG.md updated
- [ ] Version bumped (semver)
- [ ] Migration scripts tested (forward + backward)
- [ ] Documentation updated

### Release

- [ ] Create git tag (`v0.1.0`)
- [ ] Build Docker images
- [ ] Push images to registry
- [ ] Deploy backend (Cloud Run revision)
- [ ] Run database migrations
- [ ] Deploy frontend (Vercel)
- [ ] Verify health endpoints
- [ ] Smoke test critical user journeys
- [ ] Monitor error rates for 30 minutes

### Post-Release

- [ ] Tagged release in GitHub
- [ ] Release notes published
- [ ] Stakeholders notified
- [ ] Rollback procedure documented and tested
- [ ] Performance metrics compared to pre-release baseline
- [ ] Post-mortem scheduled (if notable issues)
