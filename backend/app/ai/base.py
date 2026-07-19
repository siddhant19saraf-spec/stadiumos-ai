from abc import ABC, abstractmethod
from typing import Any, Optional

from pydantic import BaseModel


class AIRequest(BaseModel):
    system_prompt: str
    user_prompt: str
    context: Optional[dict[str, Any]] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None


class AIResponse(BaseModel):
    content: str
    model: str
    provider: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    success: bool
    error_message: Optional[str] = None


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, request: AIRequest) -> AIResponse:
        pass

    @abstractmethod
    async def generate_structured(
        self, request: AIRequest, response_model: type[BaseModel]
    ) -> tuple[BaseModel, AIResponse]:
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        pass
