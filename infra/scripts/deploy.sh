#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# StadiumOS AI — Deployment Script
# Usage: ./deploy.sh [environment] [version]
# ═══════════════════════════════════════════════════════

set -euo pipefail

ENVIRONMENT="${1:-production}"
IMAGE_TAG="${2:-latest}"
COMPOSE_DIR="$(cd "$(dirname "$0")/../compose" && pwd)"

echo "═══════════════════════════════════════════"
echo "  StadiumOS AI — Deployment"
echo "  Environment: $ENVIRONMENT"
echo "  Image Tag:   $IMAGE_TAG"
echo "  Date:        $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "═══════════════════════════════════════════"

validate_prerequisites() {
    echo "Validating prerequisites..."
    command -v docker >/dev/null 2>&1 || { echo "❌ docker required"; exit 1; }
    command -v docker compose >/dev/null 2>&1 || { echo "❌ docker compose required"; exit 1; }
    echo "✅ All prerequisites met"
}

pull_images() {
    echo "Pulling images..."
    docker compose \
        -f "$COMPOSE_DIR/docker-compose.yml" \
        pull
    echo "✅ Images pulled"
}

deploy_stack() {
    echo "Deploying stack..."
    IMAGE_TAG="$IMAGE_TAG" \
    docker compose \
        -f "$COMPOSE_DIR/docker-compose.yml" \
        up -d --remove-orphans --wait
    echo "✅ Stack deployed"
}

health_check() {
    echo "Running health check..."
    local api_url="${API_URL:-http://localhost:8000}"
    local retries=12

    for i in $(seq 1 $retries); do
        status=$(curl -s -o /dev/null -w '%{http_code}' "$api_url/api/v1/health" || echo "000")
        if [ "$status" = "200" ]; then
            echo "✅ Health check passed (attempt $i/$retries)"
            return 0
        fi
        echo "  Waiting... (attempt $i/$retries, status: $status)"
        sleep 10
    done

    echo "❌ Health check failed after $retries attempts"
    return 1
}

cleanup() {
    echo "Cleaning up old images..."
    docker system prune -f --filter "until=24h"
    echo "✅ Cleanup complete"
}

# Rollback support
if [ "${ROLLBACK:-false}" = "true" ]; then
    echo "⚠️ Rollback mode enabled"
    PREVIOUS_TAG=$(docker images --format '{{.Tag}}' stadiumos/backend | sort -V | tail -2 | head -1)
    IMAGE_TAG="${PREVIOUS_TAG:-$IMAGE_TAG}"
    echo "Rolling back to: $IMAGE_TAG"
fi

validate_prerequisites
pull_images
deploy_stack
health_check
cleanup

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Deployment complete"
echo "  Environment: $ENVIRONMENT"
echo "  Image Tag:   $IMAGE_TAG"
echo "═══════════════════════════════════════════"
