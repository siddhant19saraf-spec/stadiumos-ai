import json
import logging
from typing import Any, Optional, Type

from pydantic import BaseModel

from app.ai.base import AIProvider, AIRequest, AIResponse

logger = logging.getLogger(__name__)


class MockProvider(AIProvider):
    name = "mock"

    async def generate(self, request: AIRequest) -> AIResponse:
        return AIResponse(
            content=json.dumps({
                "predictions": [{
                    "zone_id": request.context.get("zone_id", "unknown") if request.context else "unknown",
                    "predicted_occupancy_30min": 120,
                    "confidence": 0.75,
                    "pin_chance": 0.15,
                }],
                "recommended_actions": ["Monitor zone density", "Prepare additional staffing if trend continues"],
            }),
            model="mock",
            provider="mock",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=0,
            success=True,
        )

    async def generate_structured(
        self, request: AIRequest, response_model: Type[BaseModel]
    ) -> tuple[BaseModel, AIResponse]:
        return response_model(), AIResponse(
            content="",
            model="mock",
            provider="mock",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=0,
            success=True,
        )

    async def is_available(self) -> bool:
        return True
