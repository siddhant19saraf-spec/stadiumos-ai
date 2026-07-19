import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
    return correlation_id_var.get()


class CorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        correlation_id = request.headers.get(
            "X-Correlation-ID",
            request.headers.get("X-Request-ID", str(uuid.uuid4())),
        )
        correlation_id_var.set(correlation_id)

        response = await call_next(request)

        response.headers["X-Correlation-ID"] = correlation_id

        return response


def setup_tracing(app: FastAPI) -> None:
    app.add_middleware(CorrelationMiddleware)

    @app.middleware("http")
    async def add_trace_headers(request: Request, call_next):
        correlation_id = correlation_id_var.get()
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Service-Name"] = "stadiumos-backend"
        return response
