# Contributing to StadiumOS AI

Thank you for your interest in contributing! This document provides guidelines for contributing to StadiumOS AI across both the frontend (Next.js/TypeScript) and backend (FastAPI/Python) codebases.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Branch Strategy](#branch-strategy)
5. [Commit Convention](#commit-convention)
6. [Code Style Guide](#code-style-guide)
7. [Testing Guidelines](#testing-guidelines)
8. [Pull Request Process](#pull-request-process)
9. [Review Checklist](#review-checklist)
10. [Issue Templates](#issue-templates)

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to maintain a respectful, inclusive, and harassment-free environment.

Key expectations:
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community

---

## Getting Started

### Prerequisites

- Node.js 20+ (frontend)
- Python 3.12+ (backend)
- Docker (PostgreSQL + Redis)
- pnpm (frontend package manager)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/stadiumos-ai.git
cd stadiumos-ai

# Frontend setup
cd frontend
pnpm install
pnpm dev

# Backend setup (separate terminal)
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Infrastructure
docker compose up -d db redis
```

---

## Development Workflow

### 1. Pick an Issue

Choose an issue from the tracker. Comment to indicate you're working on it.

### 2. Create a Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 3. Make Changes

- Write code following the [Code Style Guide](#code-style-guide)
- Add or update tests
- Run the full test suite before committing

### 4. Commit

Follow the [Commit Convention](#commit-convention):

```bash
git add .
git commit -m "feat(crowd): add real-time zone density heatmap"
```

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request against `main`.

---

## Branch Strategy

| Branch Pattern | Purpose |
|----------------|---------|
| `main` | Production-ready code |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation changes |
| `refactor/*` | Code refactoring |
| `test/*` | Test additions/modifications |
| `chore/*` | Maintenance tasks |

Branches should be short-lived (merged within days, not weeks). Rebase onto `main` frequently to avoid conflicts.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build, CI, dependencies |
| `a11y` | Accessibility improvements |

### Scopes

Common scopes: `crowd`, `emergency`, `parking`, `queue`, `digital-twin`, `maintenance`, `copilot`, `security`, `auth`, `ui`, `api`, `docs`, `test`, `perf`, `a11y`

### Examples

```
feat(crowd): add real-time zone density heatmap
fix(auth): resolve token refresh race condition
a11y(dialog): add focus trapping to modal component
docs(api): document crowd intelligence endpoints
perf(cache): implement stale-while-revalidate pattern
```

---

## Code Style Guide

### TypeScript / React

```typescript
// ✅ Do
interface UserProps {
  name: string;
  email: string;
}

function UserCard({ name, email }: UserProps) {
  const { data } = useQuery({
    queryKey: ["user", email],
    queryFn: () => fetchUser(email),
  });
  
  return <div>{name}: {email}</div>;
}

// ❌ Don't
function userCard(props: any) {
  return <div>{props.name}</div>;
}
```

**Rules:**
- Use TypeScript strict mode (already configured)
- Prefer interfaces over types for object shapes
- Use `const` assertions for literal types
- File names: `kebab-case.ts`, `PascalCase.tsx`
- Component names: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: Tailwind utility classes only
- No `any` — use `unknown` if type is not known
- Export at declaration, not at bottom of file

### Python

```python
# ✅ Do
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

async def get_crowd_analytics(
    db: AsyncSession,
    zone_id: str,
) -> CrowdAnalytics:
    """Compute crowd analytics for a given zone."""
    ...

# ❌ Don't
def getData(id):
    pass
```

**Rules:**
- Follow PEP 8 (enforced by Ruff + Black)
- Type hints on all function signatures
- Async functions for I/O operations
- Docstrings for public APIs (Google style)
- File names: `snake_case.py`
- Class names: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

### CSS / Styling

- Tailwind utility classes only — no custom CSS files
- Use `cn()` helper for conditional classes
- Follow the existing design system (dark theme)
- Use `class-variance-authority` for component variants
- Animations respect `prefers-reduced-motion`

---

## Testing Guidelines

### Frontend (Vitest)

- Place tests in `__tests__/` within the feature module
- One test file per module (or one per engine for complex modules)
- Use `@testing-library/react` for component tests
- Mock external dependencies (API calls, WebSocket)
- Use the factory functions from `tests/fixtures/factories.ts`
- Aim for 80%+ coverage on new code

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeIncident } from "@/tests/fixtures/factories";

describe("IncidentCard", () => {
  it("renders severity badge", () => {
    const incident = makeIncident({ severity: "critical" });
    render(<IncidentCard incident={incident} />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });
});
```

### Backend (pytest)

- Place tests in `backend/tests/`
- Use async test fixtures from `conftest.py`
- Use SQLite in-memory for database tests
- Mock external API calls

```python
async def test_get_zone_analytics(async_client):
    response = await async_client.get("/api/v1/crowd/zones")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
```

### Running Tests

```bash
# Frontend
pnpm test                    # All tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage report
pnpm test -- --run src/features/crowd  # Single module

# Backend
pytest
pytest --cov --cov-report=term-missing
pytest tests/test_crowd.py -v  # Single file
```

---

## Pull Request Process

1. **Title** follows the commit convention: `feat(crowd): add zone heatmap`
2. **Description** includes:
   - What this PR does
   - Why this change is needed
   - How it was tested
   - Screenshots (for UI changes)
   - Related issue number
3. **Checklist** is completed:
   - [ ] Code follows style guide
   - [ ] Tests added/updated and passing
   - [ ] All existing tests pass
   - [ ] Documentation updated
   - [ ] Changes are backward compatible
   - [ ] No new TypeScript/Python errors
   - [ ] Accessibility considered
   - [ ] Performance impact considered

### Review Process

1. PR is reviewed by at least one team member
2. Reviewer checks code quality, tests, and architecture
3. All comments must be resolved before merge
4. Squash-merge into `main`
5. Delete the source branch

---

## Review Checklist

### Code Quality
- [ ] Follows project code style
- [ ] No dead code or commented-out code
- [ ] Proper error handling
- [ ] Meaningful variable/function names
- [ ] Appropriate abstraction level
- [ ] No hardcoded values (use constants)

### Testing
- [ ] Tests cover the new functionality
- [ ] Tests cover error cases
- [ ] Test names describe expected behavior
- [ ] No test flakiness
- [ ] Integration tests for cross-module changes

### Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] ARIA labels and roles are correct
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Screen reader announcements for dynamic content
- [ ] Focus management is predictable

### Performance
- [ ] No unnecessary re-renders
- [ ] Data fetching is cached appropriately
- [ ] Large lists are virtualized
- [ ] Bundle size impact is reasonable
- [ ] API response times are acceptable

### Security
- [ ] User input is validated (Zod/Pydantic)
- [ ] Authentication checks are in place
- [ ] Proper authorization (RBAC)
- [ ] No secrets in code
- [ ] SQL injection is prevented

---

## Issue Templates

### Bug Report

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What should happen instead.

**Screenshots**
If applicable.

**Environment**
- Browser: [Chrome, Firefox, etc.]
- Version: [0.1.0]
- OS: [Windows, macOS, Linux]
```

### Feature Request

```markdown
**Problem**
What problem does this feature solve?

**Solution**
Describe the solution you'd like.

**Alternatives**
Any alternative solutions considered.

**Additional context**
Any other information.
```

### Accessibility Issue

```markdown
**WCAG Criterion**
e.g., 2.4.7 Focus Visible

**Current behavior**
What is currently happening.

**Expected behavior**
What should happen to meet WCAG.

**Affected component**
Which component/module is affected.

**Screen reader behavior**
What the screen reader currently announces.
```
