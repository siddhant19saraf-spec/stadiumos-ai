import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="general")
    capacity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    crowd_snapshots = relationship("CrowdSnapshot", back_populates="zone")


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    event_type = Column(String, nullable=False, default="match")
    start_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="scheduled")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    crowd_snapshots = relationship("CrowdSnapshot", back_populates="event")


class CrowdSnapshot(Base):
    __tablename__ = "crowd_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    current_count = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False, default=0)
    predicted_count_30min = Column(Integer, nullable=True)
    density_percent = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    zone = relationship("Zone", back_populates="crowd_snapshots")
    event = relationship("Event", back_populates="crowd_snapshots")
