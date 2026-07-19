import math
from typing import Any, Generic, Optional, Sequence, TypeVar

from pydantic import BaseModel, Field
from sqlalchemy import Select, func
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")
ModelType = TypeVar("ModelType")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Sort field")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$", description="Sort direction")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginatedResult(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


async def paginate_query(
    db: AsyncSession,
    query: Select,
    params: PaginationParams,
    mapper: Optional[callable] = None,
) -> PaginatedResult[Any]:
    count_query = query.with_only_columns(func.count(), maintain_column_froms=True)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    if params.sort_by:
        column = getattr(query.selected_columns, params.sort_by, None)
        if column is not None:
            query = query.order_by(column.desc() if params.sort_order == "desc" else column.asc())

    query = query.offset(params.offset).limit(params.limit)
    result = await db.execute(query)
    rows = result.scalars().all()

    items = [mapper(row) for row in rows] if mapper else list(rows)

    total_pages = max(1, math.ceil(total / params.page_size)) if total > 0 else 0

    return PaginatedResult(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=params.page < total_pages,
        has_previous=params.page > 1,
    )
