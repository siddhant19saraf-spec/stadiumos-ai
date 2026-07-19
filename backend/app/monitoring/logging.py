import logging
import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.monitoring.tracing import get_correlation_id


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.monotonic()
        correlation_id = get_correlation_id()

        logger = logging.getLogger("stadiumos.api")
        logger.info(
            "Request started",
            extra={
                "correlation_id": correlation_id,
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query),
                "client_host": request.client.host if request.client else None,
            },
        )

        response = await call_next(request)

        duration = time.monotonic() - start_time
        logger.info(
            "Request completed",
            extra={
                "correlation_id": correlation_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": int(duration * 1000),
            },
        )

        return response


def setup_request_logging(app: FastAPI) -> None:
    app.add_middleware(StructuredLoggingMiddleware)
