import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crowd.db_models import CrowdSnapshot, Event, Zone
from app.modules.crowd.models import CrowdPredictionResponse


@pytest.fixture
def test_zone_id() -> str:
    return str(uuid.uuid4())


@pytest.fixture
def test_event_id() -> str:
    return str(uuid.uuid4())


@pytest.mark.asyncio
async def test_crowd_snapshots_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/crowd/snapshots")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_crowd_snapshots_empty(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    response = await client.get("/api/v1/crowd/snapshots", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == []


@pytest.mark.asyncio
async def test_crowd_snapshots_with_data(
    client: AsyncClient, auth_headers: dict[str, str], test_session: AsyncSession,
    test_zone_id: str, test_event_id: str,
) -> None:
    zone = Zone(id=uuid.UUID(test_zone_id), name="Test Zone", capacity=200)
    event = Event(id=uuid.UUID(test_event_id), name="Test Event")
    test_session.add_all([zone, event])
    await test_session.commit()

    snapshot = CrowdSnapshot(
        zone_id=uuid.UUID(test_zone_id),
        event_id=uuid.UUID(test_event_id),
        current_count=100,
        density_percent=45.5,
        capacity=200,
    )
    test_session.add(snapshot)
    await test_session.commit()

    response = await client.get("/api/v1/crowd/snapshots", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["current_count"] == 100
    assert data["pagination"]["total"] == 1


@pytest.mark.asyncio
async def test_crowd_predict_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/crowd/predict", json={"zone_id": "zone-1", "event_id": "event-1"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_crowd_predict_with_data(
    client: AsyncClient, auth_headers: dict[str, str], test_session: AsyncSession,
    test_zone_id: str, test_event_id: str,
) -> None:
    zone = Zone(id=uuid.UUID(test_zone_id), name="Test Zone", capacity=200)
    event = Event(id=uuid.UUID(test_event_id), name="Test Event")
    test_session.add_all([zone, event])
    await test_session.commit()

    snapshot = CrowdSnapshot(
        zone_id=uuid.UUID(test_zone_id),
        event_id=uuid.UUID(test_event_id),
        current_count=150,
        density_percent=65.0,
        capacity=200,
    )
    test_session.add(snapshot)
    await test_session.commit()

    response = await client.post(
        "/api/v1/crowd/predict",
        json={"zone_id": test_zone_id, "event_id": test_event_id},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    prediction = data["data"]
    assert len(prediction["predictions"]) > 0
    p = prediction["predictions"][0]
    assert p["zone_id"] == test_zone_id
    assert p["predicted_occupancy_30min"] > 0
    assert p["confidence"] >= 0


@pytest.mark.asyncio
async def test_crowd_alert_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/crowd/alert",
        json={"zone_id": "zone-1", "event_id": "event-1", "threshold": 80.0},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_crowd_alert_no_threshold_breach(
    client: AsyncClient, auth_headers: dict[str, str], test_session: AsyncSession,
    test_zone_id: str, test_event_id: str,
) -> None:
    zone = Zone(id=uuid.UUID(test_zone_id), name="Test Zone", capacity=200)
    event = Event(id=uuid.UUID(test_event_id), name="Test Event")
    test_session.add_all([zone, event])
    await test_session.commit()

    snapshot = CrowdSnapshot(
        zone_id=uuid.UUID(test_zone_id),
        event_id=uuid.UUID(test_event_id),
        current_count=50,
        density_percent=25.0,
        capacity=200,
    )
    test_session.add(snapshot)
    await test_session.commit()

    response = await client.post(
        "/api/v1/crowd/alert",
        json={"zone_id": test_zone_id, "event_id": test_event_id, "threshold": 80.0},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["message"] == "No alert triggered - density within thresholds"


@pytest.mark.asyncio
async def test_crowd_alert_with_threshold_breach(
    client: AsyncClient, auth_headers: dict[str, str], test_session: AsyncSession,
    test_zone_id: str, test_event_id: str,
) -> None:
    zone = Zone(id=uuid.UUID(test_zone_id), name="Test Zone", capacity=200)
    event = Event(id=uuid.UUID(test_event_id), name="Test Event")
    test_session.add_all([zone, event])
    await test_session.commit()

    snapshot = CrowdSnapshot(
        zone_id=uuid.UUID(test_zone_id),
        event_id=uuid.UUID(test_event_id),
        current_count=180,
        density_percent=90.0,
        capacity=200,
    )
    test_session.add(snapshot)
    await test_session.commit()

    response = await client.post(
        "/api/v1/crowd/alert",
        json={"zone_id": test_zone_id, "event_id": test_event_id, "threshold": 80.0},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["severity"] == "critical"


@pytest.mark.asyncio
async def test_crowd_prediction_service_fallback(
    test_session: AsyncSession, test_zone_id: str, test_event_id: str,
) -> None:
    from app.modules.crowd.service import CrowdService

    zone = Zone(id=uuid.UUID(test_zone_id), name="Test Zone", capacity=250)
    event = Event(id=uuid.UUID(test_event_id), name="Test Event")
    test_session.add_all([zone, event])
    await test_session.commit()

    snapshot = CrowdSnapshot(
        zone_id=uuid.UUID(test_zone_id),
        event_id=uuid.UUID(test_event_id),
        current_count=200,
        density_percent=80.0,
        capacity=250,
    )
    test_session.add(snapshot)
    await test_session.commit()

    service = CrowdService(test_session)
    result = await service.predict_crowd(zone_id=test_zone_id, event_id=test_event_id)

    assert isinstance(result, CrowdPredictionResponse)
    assert len(result.predictions) > 0
    assert result.predictions[0].zone_id == test_zone_id
    assert result.predictions[0].predicted_occupancy_30min > 0
