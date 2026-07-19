import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import AIRequest
from app.ai.router import ai_router
from app.modules.crowd.db_models import CrowdSnapshot
from app.modules.crowd.models import (
    CrowdAlertResponse,
    CrowdPredictionResponse,
    ZonePrediction,
)

logger = logging.getLogger(__name__)


class CrowdService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_snapshot(self, snapshot_id: str) -> Optional[CrowdSnapshot]:
        result = await self.db.execute(
            select(CrowdSnapshot).where(CrowdSnapshot.id == snapshot_id)
        )
        return result.scalar_one_or_none()

    async def get_recent_snapshots(
        self, zone_id: str, limit: int = 100
    ) -> list[CrowdSnapshot]:
        result = await self.db.execute(
            select(CrowdSnapshot)
            .where(CrowdSnapshot.zone_id == zone_id)
            .order_by(CrowdSnapshot.recorded_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def predict_crowd(
        self, zone_id: str, event_id: str
    ) -> CrowdPredictionResponse:
        recent_data = await self.get_recent_snapshots(zone_id, limit=10)

        context = {
            "zone_id": zone_id,
            "event_id": event_id,
            "recent_counts": [s.current_count for s in recent_data],
            "density_percentages": [s.density_percent for s in recent_data],
        }

        ai_request = AIRequest(
            system_prompt=(
                "You are a stadium crowd intelligence analyst. "
                "Analyze crowd sensor data and predict movement patterns. "
                "Respond with valid JSON matching the requested schema."
            ),
            user_prompt=f"Predict crowd movement for zone {zone_id}: {context}",
            context=context,
        )

        response = await ai_router.generate(ai_request, cache_key=f"crowd:{zone_id}:{event_id}")

        return CrowdPredictionResponse(
            predictions=[
                ZonePrediction(
                    zone_id=zone_id,
                    predicted_occupancy_30min=0,
                    confidence=0.0,
                    pin_chance=0.0,
                )
            ],
            recommended_actions=[],
        )

    async def check_threshold(
        self, zone_id: str, event_id: str, threshold: float = 80.0
    ) -> Optional[CrowdAlertResponse]:
        result = await self.db.execute(
            select(CrowdSnapshot)
            .where(CrowdSnapshot.zone_id == zone_id)
            .where(CrowdSnapshot.event_id == event_id)
            .order_by(CrowdSnapshot.recorded_at.desc())
            .limit(1)
        )
        snapshot = result.scalar_one_or_none()

        if snapshot is None or snapshot.density_percent < threshold:
            return None

        return CrowdAlertResponse(
            zone_id=zone_id,
            severity="warning" if snapshot.density_percent < 90 else "critical",
            message=(
                f"Zone density at {snapshot.density_percent:.1f}% "
                f"exceeds threshold of {threshold:.0f}%"
            ),
            current_density=snapshot.density_percent,
        )
