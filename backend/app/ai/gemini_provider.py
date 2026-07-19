import logging
import time
from typing import Optional, Type

import google.generativeai as genai
from pydantic import BaseModel

from app.ai.base import AIProvider, AIRequest, AIResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    def __init__(self) -> None:
        self._model: Optional[genai.GenerativeModel] = None
        self._model_name: str = settings.gemini_model
        self._initialized = False

    async def _ensure_initialized(self) -> None:
        if not self._initialized:
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(self._model_name)
            self._initialized = True

    async def generate(self, request: AIRequest) -> AIResponse:
        start_time = time.monotonic()
        await self._ensure_initialized()

        try:
            combined_prompt = f"{request.system_prompt}\n\n{request.user_prompt}"
            response = await self._model.generate_content_async(
                combined_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=request.max_tokens or settings.gemini_max_tokens,
                    temperature=request.temperature or settings.gemini_temperature,
                ),
            )

            latency_ms = (time.monotonic() - start_time) * 1000

            return AIResponse(
                content=response.text,
                model=self._model_name,
                provider="gemini",
                prompt_tokens=response.usage_metadata.prompt_token_count if response.usage_metadata else 0,
                completion_tokens=response.usage_metadata.candidates_token_count if response.usage_metadata else 0,
                latency_ms=latency_ms,
                success=True,
            )
        except Exception as e:
            latency_ms = (time.monotonic() - start_time) * 1000
            logger.error(f"Gemini generation failed: {e}")
            return AIResponse(
                content="",
                model=self._model_name,
                provider="gemini",
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
        await self._ensure_initialized()

        try:
            schema = response_model.model_json_schema()
            combined_prompt = (
                f"{request.system_prompt}\n\n{request.user_prompt}\n\n"
                f"Respond with valid JSON matching this schema: {schema}"
            )

            response = await self._model.generate_content_async(
                combined_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=request.max_tokens or settings.gemini_max_tokens,
                    temperature=request.temperature or settings.gemini_temperature,
                ),
            )

            latency_ms = (time.monotonic() - start_time) * 1000
            parsed = response_model.model_validate_json(response.text)

            ai_response = AIResponse(
                content=response.text,
                model=self._model_name,
                provider="gemini",
                prompt_tokens=response.usage_metadata.prompt_token_count if response.usage_metadata else 0,
                completion_tokens=response.usage_metadata.candidates_token_count if response.usage_metadata else 0,
                latency_ms=latency_ms,
                success=True,
            )

            return parsed, ai_response
        except Exception as e:
            latency_ms = (time.monotonic() - start_time) * 1000
            logger.error(f"Gemini structured generation failed: {e}")
            raise

    async def is_available(self) -> bool:
        if not settings.gemini_api_key:
            return False
        try:
            await self._ensure_initialized()
            return True
        except Exception:
            return False
