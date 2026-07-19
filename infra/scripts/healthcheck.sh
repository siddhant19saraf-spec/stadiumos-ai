#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# StadiumOS AI — Health Check
# Validates all services are operational
# ═══════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="${API_URL:-http://localhost:8000}"
FRONTEND_URL="${APP_URL:-http://localhost:3000}"
TIMEOUT=10

passed=0
failed=0

check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$url" || echo "000")

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅${NC} $name — $status"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌${NC} $name — expected $expected_status, got $status"
        failed=$((failed + 1))
    fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  StadiumOS AI — Health Check"
echo "  $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "═══════════════════════════════════════════"
echo ""

# Backend endpoints
check_endpoint "Backend Health" "$API_BASE/api/v1/health"
check_endpoint "Backend Readiness" "$API_BASE/api/v1/ready"
check_endpoint "Backend Liveness" "$API_BASE/api/v1/live"
check_endpoint "Backend Root" "$API_BASE/api/v1"
check_endpoint "Backend Docs" "$API_BASE/api/v1/docs" 200

# Frontend
check_endpoint "Frontend" "$FRONTEND_URL" 200

# Monitoring (optional)
if [ -n "${PROMETHEUS_URL:-}" ]; then
    check_endpoint "Prometheus" "$PROMETHEUS_URL/-/healthy" 200
fi
if [ -n "${GRAFANA_URL:-}" ]; then
    check_endpoint "Grafana" "$GRAFANA_URL/api/health" 200
fi

echo ""
echo "═══════════════════════════════════════════"
echo -e "Results: ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}"
echo "═══════════════════════════════════════════"
echo ""

exit $failed
