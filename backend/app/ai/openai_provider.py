import logging
import time
from typing import Optional, Type

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.ai.base import AIProvider, AIRequest, AIResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    def __init__(self) -> None:
        self._client: Optional[AsyncOpenAI] = None
        self._model: str = settings.openai_model

    async def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._client

    async def generate(self, request: AIRequest) -> AIResponse:
        start_time = time.monotonic()
        client = await self._get_client()

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": request.system_prompt},
                    {"role": "user", "content": request.user_prompt},
                ],
                max_tokens=request.max_tokens or settings.openai_max_tokens,
                temperature=request.temperature or settings.openai_temperature,
            )

            latency_ms = (time.monotonic() - start_time) * 1000

            return AIResponse(
                content=response.choices[0].message.content or "",
                model=self._model,
                provider="openai",
                prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
                completion_tokens=response.usage.completion_tokens if response.usage else 0,
                latency_ms=latency_ms,
                success=True,
            )
        except Exception as e:
            latency_ms = (time.monotonic() - start_time) * 1000
            logger.error(f"OpenAI generation failed: {e}")
            return AIResponse(
                content="",
                model=self._model,
                provider="openai",
                prompt_tokens=0,
                completion_tokens=0,
                latency_ms=latency_ms,
                success=False,
                error_message=str(e),
            )

    async def generate_structured(
        self, request: AIRequest, response_model: Type[BaseModel]
    ) -> tuple[BaseModel, AIResponse]:
        start_time = time.monotonic()
        client = await self._get_client()

        try:
            completion = await client.beta.chat.completions.parse(
                model=self._model,
                messages=[
                    {"role": "system", "content": request.system_prompt},
                    {"role": "user", "content": request.user_prompt},
                ],
                response_format=response_model,
                max_tokens=request.max_tokens or settings.openai_max_tokens,
                temperature=request.temperature or settings.openai_temperature,
            )

            latency_ms = (time.monotonic() - start_time) * 1000
            parsed = completion.choices[0].message.parsed

            ai_response = AIResponse(
                content=str(parsed),
                model=self._model,
                provider="openai",
                prompt_tokens=completion.usage.prompt_tokens if completion.usage else 0,
                completion_tokens=completion.usage.completion_tokens if completion.usage else 0,
                latency_ms=latency_ms,
                success=True,
            )

            return parsed, ai_response
        except Exception as e:
            latency_ms = (time.monotonic() - start_time) * 1000
            logger.error(f"OpenAI structured generation failed: {e}")
            raise

    async def is_available(self) -> bool:
        if not settings.openai_api_key:
            return False
        try:
            client = await self._get_client()
            await client.models.list()
            return True
        except Exception:
            return False
