from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserDep, DatabaseDep
from app.lib.response import APIResponse
from app.lib.pagination import PaginationParams, paginate_query
from app.modules.crowd.db_models import CrowdSnapshot
from app.modules.crowd.models import (
    CrowdAlertRequest,
    CrowdPredictionRequest,
    CrowdSnapshotResponse,
)
from app.modules.crowd.service import CrowdService

router = APIRouter(prefix="/crowd", tags=["Crowd Intelligence"])


@router.get("/snapshots")
async def get_snapshots(
    db: DatabaseDep,
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    params = PaginationParams(page=page, page_size=page_size)
    query = select(CrowdSnapshot).order_by(CrowdSnapshot.recorded_at.desc())
    result = await paginate_query(db, query, params)
    serialized = [
        CrowdSnapshotResponse(
            id=s.id,
            zone_id=str(s.zone_id),
            event_id=str(s.event_id),
            current_count=s.current_count,
            predicted_count_30min=s.predicted_count_30min,
            density_percent=s.density_percent,
            recorded_at=s.recorded_at,
        ).model_dump(mode="json")
        for s in result.items
    ]
    return APIResponse.paginated(
        items=serialized,
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.post("/predict")
async def predict_crowd(
    request: CrowdPredictionRequest,
    db: DatabaseDep,
    current_user: CurrentUserDep,
):
    service = CrowdService(db)
    prediction = await service.predict_crowd(
        zone_id=request.zone_id,
        event_id=request.event_id,
    )
    return APIResponse.success(data=prediction.model_dump(mode="json"))


@router.post("/alert")
async def create_crowd_alert(
    request: CrowdAlertRequest,
    db: DatabaseDep,
    current_user: CurrentUserDep,
):
    service = CrowdService(db)
    alert = await service.check_threshold(
        zone_id=request.zone_id,
        event_id=request.event_id,
        threshold=request.threshold,
    )
    if alert is None:
        return APIResponse.success(
            data={"message": "No alert triggered - density within thresholds"}
        )
    return APIResponse.success(data=alert.model_dump(mode="json"))
