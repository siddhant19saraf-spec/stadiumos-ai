# StadiumOS AI — Enterprise Testing Guide

## Test Architecture

```
tests/
├── setup.ts                    # Global test setup (jest-dom, mocks)
├── fixtures/
│   ├── factories.ts            # 40+ type-safe factory functions
│   ├── mocks.ts                # Mock utilities (fetch, localStorage, etc.)
│   ├── test-utils.ts           # Shared test utilities
│   └── index.ts                # Re-exports
├── unit/                       # 13 module test files (~1,939 cases)
├── integration/                # Cross-module integration tests
├── e2e/                        # User journey simulations
├── ai-validation/              # AI-specific validation tests
├── api/                        # API client tests
├── security/                   # RBAC, auth, audit, injection tests
├── performance/                # Benchmarks, load, concurrency tests
├── accessibility/              # WCAG 2.2 AA compliance tests
└── error-handling/             # Edge case and failure mode tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific category
npx vitest run tests/unit/
npx vitest run tests/integration/
npx vitest run tests/e2e/
npx vitest run tests/security/

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E with Playwright
npm run test:e2e
```

## Writing Tests

### Pattern: Service/Engine Tests

```typescript
import { describe, it, expect } from "vitest";
import { MockIncidentEngine } from "@/features/emergency-response/services/incident-engine";
import { makeIncident } from "../../tests/fixtures/factories";

describe("Feature Module", () => {
  const engine = new MockIncidentEngine();

  it("should process input correctly", async () => {
    const input = makeIncident({ /* overrides */ });
    const result = await engine.process(input);
    expect(result.status).toBe("expected");
  });

  it("should handle edge case", () => {
    const result = engine.process([]);
    expect(result).toEqual([]);
  });
});
```

### Pattern: Factory Overrides

All factory functions accept partial overrides:

```typescript
const incident = makeIncident({
  severity: "critical",
  type: "fire",
  status: "reported",
});
```

## Quality Thresholds

| Metric | Target |
|--------|--------|
| Line coverage | 80%+ |
| Branch coverage | 75%+ |
| Function coverage | 80%+ |
| Statement coverage | 80%+ |
| Test pass rate | 95%+ |
| Security tests | 0 failures |
