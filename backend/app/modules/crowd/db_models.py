import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class CrowdSnapshot(Base):
    __tablename__ = "crowd_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    current_count = Column(Integer, nullable=False)
    predicted_count_30min = Column(Integer, nullable=True)
    density_percent = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    zone = relationship("Zone", back_populates="crowd_snapshots")
    event = relationship("Event", back_populates="crowd_snapshots")
