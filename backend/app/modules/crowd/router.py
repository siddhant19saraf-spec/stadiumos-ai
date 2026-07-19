from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DatabaseDep
from app.lib.response import APIResponse
from app.lib.pagination import PaginationParams, paginate_query
from app.modules.crowd.db_models import CrowdSnapshot
from app.modules.crowd.models import (
    CrowdAlertRequest,
    CrowdAlertResponse,
    CrowdPredictionRequest,
    CrowdPredictionResponse,
)
from app.modules.crowd.service import CrowdService

router = APIRouter(prefix="/crowd", tags=["Crowd Intelligence"])


@router.get("/snapshots")
async def get_snapshots(
    db: DatabaseDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    params = PaginationParams(page=page, page_size=page_size)
    query = CrowdSnapshot.__table__.select().order_by(CrowdSnapshot.recorded_at.desc())
    result = await paginate_query(db, query, params)
    return APIResponse.paginated(
        items=result.items,
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.post("/predict", response_model=CrowdPredictionResponse)
async def predict_crowd(
    request: CrowdPredictionRequest,
    db: DatabaseDep,
):
    service = CrowdService(db)
    prediction = await service.predict_crowd(
        zone_id=str(request.zone_id),
        event_id=str(request.event_id),
    )
    return APIResponse.success(data=prediction)


@router.post("/alert", response_model=CrowdAlertResponse)
async def create_crowd_alert(
    request: CrowdAlertRequest,
    db: DatabaseDep,
):
    service = CrowdService(db)
    alert = await service.check_threshold(
        zone_id=str(request.zone_id),
        event_id=str(request.event_id),
        threshold=request.threshold,
    )
    if alert is None:
        return APIResponse.success(
            data={"message": "No alert triggered - density within thresholds"}
        )
    return APIResponse.success(data=alert)
