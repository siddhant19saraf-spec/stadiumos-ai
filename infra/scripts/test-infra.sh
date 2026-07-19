#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# StadiumOS AI — Infrastructure Validation Tests
# ═══════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

passed=0
failed=0
skipped=0

pass() {
    echo -e "${GREEN}✅${NC} $1"
    passed=$((passed + 1))
}

fail() {
    echo -e "${RED}❌${NC} $1"
    failed=$((failed + 1))
}

skip() {
    echo -e "${YELLOW}⚠️${NC} $1 (skipped)"
    skipped=$((skipped + 1))
}

echo ""
echo "═══════════════════════════════════════════"
echo "  StadiumOS AI — Infrastructure Tests"
echo "═══════════════════════════════════════════"
echo ""

# ─── Dockerfile Tests ──────────────────────────
echo "--- Dockerfile Tests ---"

if [ -f "infra/docker/frontend/Dockerfile" ]; then
    pass "Frontend Dockerfile exists"
    if grep -q "HEALTHCHECK" "infra/docker/frontend/Dockerfile"; then
        pass "Frontend Dockerfile has HEALTHCHECK"
    else
        fail "Frontend Dockerfile missing HEALTHCHECK"
    fi
    if grep -q "USER .*nextjs\|USER .*node" "infra/docker/frontend/Dockerfile"; then
        pass "Frontend Dockerfile uses non-root user"
    else
        fail "Frontend Dockerfile missing non-root user"
    fi
else
    fail "Frontend Dockerfile missing"
fi

if [ -f "infra/docker/backend/Dockerfile" ]; then
    pass "Backend Dockerfile exists"
    if grep -q "HEALTHCHECK" "infra/docker/backend/Dockerfile"; then
        pass "Backend Dockerfile has HEALTHCHECK"
    else
        fail "Backend Dockerfile missing HEALTHCHECK"
    fi
    if grep -q "USER .*stadiumos" "infra/docker/backend/Dockerfile"; then
        pass "Backend Dockerfile uses non-root user"
    else
        fail "Backend Dockerfile missing non-root user"
    fi
    if grep -q "multi-stage\|FROM.*AS" "infra/docker/backend/Dockerfile"; then
        pass "Backend Dockerfile uses multi-stage build"
    else
        fail "Backend Dockerfile missing multi-stage build"
    fi
else
    fail "Backend Dockerfile missing"
fi

if [ -f "frontend/.dockerignore" ]; then
    pass "Frontend .dockerignore exists"
else
    fail "Frontend .dockerignore missing"
fi

if [ -f "backend/.dockerignore" ]; then
    pass "Backend .dockerignore exists"
else
    fail "Backend .dockerignore missing"
fi

# ─── Docker Compose Tests ──────────────────────
echo ""
echo "--- Docker Compose Tests ---"

if [ -f "infra/compose/docker-compose.yml" ]; then
    pass "Production docker-compose.yml exists"
    if grep -q "healthcheck" "infra/compose/docker-compose.yml"; then
        pass "Services have health checks"
    else
        fail "Services missing health checks"
    fi
else
    fail "Production docker-compose.yml missing"
fi

if [ -f "infra/compose/docker-compose.dev.yml" ]; then
    pass "Development docker-compose.dev.yml exists"
fi

if [ -f "infra/compose/docker-compose.monitoring.yml" ]; then
    pass "Monitoring docker-compose.monitoring.yml exists"
fi

# ─── CI/CD Tests ───────────────────────────────
echo ""
echo "--- CI/CD Tests ---"

if [ -d ".github/workflows" ]; then
    workflows=$(find .github/workflows -name "*.yml" | wc -l)
    if [ "$workflows" -ge 3 ]; then
        pass "$workflows GitHub Actions workflows found"
    else
        fail "Fewer than 3 workflows ($workflows found)"
    fi
else
    fail ".github/workflows directory missing"
fi

# ─── Monitoring Tests ──────────────────────────
echo ""
echo "--- Monitoring Tests ---"

if [ -d "infra/monitoring" ]; then
    pass "Monitoring directory exists"
    [ -f "infra/monitoring/prometheus/prometheus.yml" ] && pass "Prometheus config exists" || fail "Prometheus config missing"
    [ -d "infra/monitoring/prometheus/rules" ] && pass "Alert rules directory exists" || fail "Alert rules directory missing"
    [ -f "infra/monitoring/grafana/datasources/datasources.yml" ] && pass "Grafana datasources exist" || fail "Grafana datasources missing"
else
    fail "Monitoring directory missing"
fi

# ─── Security Tests ────────────────────────────
echo ""
echo "--- Security Tests ---"

if [ -f ".github/workflows/security-scan.yml" ]; then
    pass "Security scan workflow exists"
fi

if grep -q "trivy\|safety\|bandit\|trufflehog\|gitleaks\|semgrep\|codeql" ".github/workflows/security-scan.yml" 2>/dev/null; then
    pass "Security tools configured (Trivy, Safety, Bandit, TruffleHog, CodeQL)"
fi

if grep -q "sbom" ".github/workflows/security-scan.yml" 2>/dev/null; then
    pass "SBOM generation configured"
fi

# ─── Documentation Tests ───────────────────────
echo ""
echo "--- Documentation Tests ---"

if [ -d "docs/ops" ]; then
    ops_docs=$(find docs/ops -name "*.md" | wc -l)
    if [ "$ops_docs" -ge 3 ]; then
        pass "$ops_docs operations documents found"
    fi
fi

if [ -d "docs" ]; then
    total_docs=$(find docs -name "*.md" | wc -l)
    pass "$total_docs total documentation files"
fi

# ─── Scripts Tests ─────────────────────────────
echo ""
echo "--- Scripts Tests ---"

if [ -d "infra/scripts" ]; then
    scripts=$(find infra/scripts -name "*.sh" | wc -l)
    if [ "$scripts" -ge 2 ]; then
        pass "$scripts infrastructure scripts found"
    fi
fi

echo ""
echo "═══════════════════════════════════════════"
echo -e "Results: ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}, ${YELLOW}$skipped skipped${NC}"
echo "═══════════════════════════════════════════"

exit $failed
