from typing import Any, Generic, Optional, TypeVar
from uuid import uuid4

from fastapi import Response
from fastapi.responses import JSONResponse

T = TypeVar("T")


class APIResponse(Generic[T]):
    @staticmethod
    def success(
        data: T,
        message: str = "Success",
        status_code: int = 200,
        correlation_id: Optional[str] = None,
        pagination: Optional[dict[str, Any]] = None,
    ) -> JSONResponse:
        body: dict[str, Any] = {
            "success": True,
            "data": data,
            "message": message,
            "timestamp": str(uuid4()),
        }
        if correlation_id:
            body["correlationId"] = correlation_id
        if pagination:
            body["pagination"] = pagination

        response = JSONResponse(content=body, status_code=status_code)
        if correlation_id:
            response.headers["X-Correlation-ID"] = correlation_id
        return response

    @staticmethod
    def created(
        data: T,
        message: str = "Created successfully",
        correlation_id: Optional[str] = None,
    ) -> JSONResponse:
        return APIResponse.success(
            data=data,
            message=message,
            status_code=201,
            correlation_id=correlation_id,
        )

    @staticmethod
    def no_content() -> Response:
        return Response(status_code=204)

    @staticmethod
    def paginated(
        items: list[T],
        total: int,
        page: int,
        page_size: int,
        correlation_id: Optional[str] = None,
    ) -> JSONResponse:
        total_pages = (total + page_size - 1) // page_size
        pagination = {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrevious": page > 1,
        }
        return APIResponse.success(
            data=items,  # type: ignore
            message="Success",
            correlation_id=correlation_id,
            pagination=pagination,
        )
