from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class CrowdSnapshotResponse(BaseModel):
    id: UUID
    zone_id: UUID
    event_id: UUID
    current_count: int
    predicted_count_30min: Optional[int] = None
    density_percent: float
    recorded_at: datetime


class CrowdPredictionRequest(BaseModel):
    zone_id: UUID
    event_id: UUID
    include_recommendations: bool = True


class ZonePrediction(BaseModel):
    zone_id: UUID
    predicted_occupancy_30min: int
    confidence: float = Field(ge=0.0, le=1.0)
    pin_chance: float = Field(ge=0.0, le=1.0)


class RecommendedAction(BaseModel):
    action: str
    reason: str
    priority: str = Field(pattern="^(low|medium|high|critical)$")


class CrowdPredictionResponse(BaseModel):
    predictions: list[ZonePrediction]
    recommended_actions: list[RecommendedAction]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class CrowdAlertRequest(BaseModel):
    zone_id: UUID
    event_id: UUID
    threshold: float = Field(default=80.0, ge=0.0, le=100.0)


class CrowdAlertResponse(BaseModel):
    alert_id: UUID = Field(default_factory=uuid4)
    zone_id: UUID
    severity: str
    message: str
    current_density: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
