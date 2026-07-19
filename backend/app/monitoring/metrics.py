import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.routing import APIRoute
from prometheus_client import Counter, Gauge, Histogram, generate_latest, REGISTRY
from prometheus_client.exposition import CONTENT_TYPE_LATEST

# ─── HTTP Metrics ───────────────────────────────────────
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint", "status"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
)

http_requests_in_flight = Gauge(
    "http_requests_in_flight",
    "Current HTTP requests in flight",
    ["method"],
)

# ─── AI Metrics ─────────────────────────────────────────
ai_response_duration_seconds = Histogram(
    "ai_response_duration_seconds",
    "AI provider response duration in seconds",
    ["provider", "model"],
    buckets=(0.1, 0.5, 1, 2, 3, 5, 10, 15, 20, 30),
)

ai_provider_errors_total = Counter(
    "ai_provider_errors_total",
    "Total AI provider errors",
    ["provider", "error_type"],
)

ai_provider_active = Gauge(
    "ai_provider_active",
    "Currently active AI provider (1=active, 0=inactive)",
    ["provider"],
)

ai_tokens_total = Counter(
    "ai_tokens_total",
    "Total tokens consumed by AI providers",
    ["provider", "type"],
)

ai_rate_limit_hits_total = Counter(
    "ai_rate_limit_hits_total",
    "Total AI rate limit hits",
    ["provider"],
)

# ─── Auth Metrics ───────────────────────────────────────
auth_login_failures_total = Counter(
    "auth_login_failures_total",
    "Total authentication login failures",
    ["reason"],
)

auth_token_refresh_failures_total = Counter(
    "auth_token_refresh_failures_total",
    "Total token refresh failures",
    ["reason"],
)

active_users = Gauge("active_users", "Currently active users")

# ─── Cache Metrics ──────────────────────────────────────
cache_hits_total = Counter(
    "cache_hits_total",
    "Total cache hits",
    ["cache_name"],
)

cache_misses_total = Counter(
    "cache_misses_total",
    "Total cache misses",
    ["cache_name"],
)

# ─── Database Metrics ───────────────────────────────────
db_query_duration_seconds = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["query_type", "table"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)

db_connection_pool_size = Gauge(
    "db_connection_pool_size",
    "Database connection pool size",
)

# ─── Queue Metrics ──────────────────────────────────────
arq_queue_size = Gauge("arq_queue_size", "ARQ queue size")

arq_job_failures_total = Counter(
    "arq_job_failures_total",
    "Total ARQ job failures",
    ["queue", "job_name"],
)

# ─── Business Metrics ───────────────────────────────────
crowd_capacity_percentage = Gauge(
    "crowd_capacity_percentage",
    "Current crowd capacity percentage per zone",
    ["zone_id"],
)

parking_occupancy_percentage = Gauge(
    "parking_occupancy_percentage",
    "Parking lot occupancy percentage",
    ["lot_id"],
)

emergency_incidents_active = Gauge(
    "emergency_incidents_active",
    "Number of active emergency incidents",
    ["severity"],
)

# ─── Deployment Metrics ─────────────────────────────────
deployment_status = Gauge(
    "deployment_status",
    "Deployment status (1=success, 0=failure)",
    ["service", "version"],
)

deployment_rollback_active = Gauge(
    "deployment_rollback_active",
    "Whether a rollback is currently active (1=yes, 0=no)",
    ["service"],
)


class MetricsRouteHandler(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            start_time = time.monotonic()
            method = request.method
            endpoint = request.url.path

            http_requests_in_flight.labels(method=method).inc()

            response: Response = await original_route_handler(request)

            duration = time.monotonic() - start_time
            status_code = response.status_code

            http_requests_in_flight.labels(method=method).dec()
            http_requests_total.labels(
                method=method, endpoint=endpoint, status=status_code
            ).inc()
            http_request_duration_seconds.labels(
                method=method, endpoint=endpoint, status=status_code
            ).observe(duration)

            response.headers["X-Request-Duration-Ms"] = str(int(duration * 1000))

            return response

        return custom_route_handler


def setup_metrics(app: FastAPI) -> None:
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.__class__ = MetricsRouteHandler

    @app.get("/api/v1/metrics")
    async def metrics():
        return Response(
            content=generate_latest(REGISTRY),
            media_type=CONTENT_TYPE_LATEST,
        )
