import logging
from typing import Optional, Type

from pydantic import BaseModel

from app.ai.base import AIProvider, AIRequest, AIResponse
from app.ai.gemini_provider import GeminiProvider
from app.ai.openai_provider import OpenAIProvider
from app.core.cache import cache_get, cache_set
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIProviderRouter:
    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}
        self._primary_provider: Optional[str] = None
        self._fallback_provider: Optional[str] = None

    def register_provider(self, name: str, provider: AIProvider) -> None:
        self._providers[name] = provider

    def set_primary(self, name: str) -> None:
        if name not in self._providers:
            raise ValueError(f"Provider '{name}' not registered")
        self._primary_provider = name

    def set_fallback(self, name: str) -> None:
        if name not in self._providers:
            raise ValueError(f"Provider '{name}' not registered")
        self._fallback_provider = name

    async def generate(
        self,
        request: AIRequest,
        use_cache: bool = True,
        cache_key: Optional[str] = None,
    ) -> AIResponse:
        if use_cache and cache_key:
            cached = await cache_get(cache_key)
            if cached:
                return AIResponse(
                    content=cached,
                    model="cache",
                    provider="cache",
                    prompt_tokens=0,
                    completion_tokens=0,
                    latency_ms=0,
                    success=True,
                )

        response = await self._try_generate(request, self._primary_provider)

        if not response.success and self._fallback_provider:
            logger.warning(
                f"Primary provider '{self._primary_provider}' failed. "
                f"Trying fallback '{self._fallback_provider}'."
            )
            response = await self._try_generate(request, self._fallback_provider)

        if use_cache and cache_key and response.success:
            await cache_set(cache_key, response.content, settings.ai_cache_ttl_seconds)

        return response

    async def generate_structured(
        self,
        request: AIRequest,
        response_model: Type[BaseModel],
        use_cache: bool = True,
        cache_key: Optional[str] = None,
    ) -> tuple[BaseModel, AIResponse]:
        provider_name = self._primary_provider
        provider = self._providers.get(provider_name)

        if provider is None:
            raise ValueError(f"Primary provider '{provider_name}' not available")

        try:
            return await provider.generate_structured(request, response_model)
        except Exception:
            if self._fallback_provider:
                fallback = self._providers.get(self._fallback_provider)
                if fallback:
                    return await fallback.generate_structured(request, response_model)
            raise

    async def _try_generate(
        self, request: AIRequest, provider_name: Optional[str]
    ) -> AIResponse:
        if provider_name is None:
            return AIResponse(
                content="",
                model="none",
                provider="none",
                prompt_tokens=0,
                completion_tokens=0,
                latency_ms=0,
                success=False,
                error_message="No provider configured",
            )

        provider = self._providers.get(provider_name)
        if provider is None:
            return AIResponse(
                content="",
                model=provider_name,
                provider=provider_name,
                prompt_tokens=0,
                completion_tokens=0,
                latency_ms=0,
                success=False,
                error_message=f"Provider '{provider_name}' not found",
            )

        return await provider.generate(request)


ai_router = AIProviderRouter()
ai_router.register_provider("openai", OpenAIProvider())
ai_router.register_provider("gemini", GeminiProvider())
ai_router.set_primary(settings.ai_provider_primary.value)
ai_router.set_fallback(settings.ai_provider_fallback.value)
