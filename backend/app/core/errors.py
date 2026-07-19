from typing import Any, Optional
from uuid import uuid4

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class StadiumOSError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        self.correlation_id = correlation_id or str(uuid4())
        super().__init__(self.message)


class NotFoundError(StadiumOSError):
    def __init__(
        self,
        message: str = "Resource not found",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details=details,
        )


class ValidationError(StadiumOSError):
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class UnauthorizedError(StadiumOSError):
    def __init__(
        self,
        message: str = "Unauthorized",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED",
            details=details,
        )


class ForbiddenError(StadiumOSError):
    def __init__(
        self,
        message: str = "Forbidden",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
            details=details,
        )


class AIProviderError(StadiumOSError):
    def __init__(
        self,
        message: str = "AI provider error",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=503,
            error_code="AI_PROVIDER_ERROR",
            details=details,
        )


class RateLimitError(StadiumOSError):
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMITED",
            details=details,
        )


async def stadiumos_error_handler(request: Request, exc: StadiumOSError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.error_code,
            "message": exc.message,
            "statusCode": exc.status_code,
            "correlationId": exc.correlation_id,
            "details": exc.details,
            "timestamp": exc.correlation_id,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "HTTP_ERROR",
            "message": exc.detail,
            "statusCode": exc.status_code,
            "timestamp": str(uuid4()),
        },
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "statusCode": 500,
            "correlationId": str(uuid4()),
            "timestamp": str(uuid4()),
        },
    )
