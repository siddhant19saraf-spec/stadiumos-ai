import logging
import os
import sys
from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class AIProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    MOCK = "mock"


class Environment(str, Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "StadiumOS AI"
    app_version: str = "0.1.0"
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = True
    api_prefix: str = "/api/v1"

    # Security — defaults are DEVELOPMENT-ONLY placeholders
    auth_secret: str = "change-me-to-a-random-secret"
    jwt_secret: str = "change-me-to-another-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 15
    jwt_refresh_expiry_days: int = 7
    bcrypt_rounds: int = 12
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    # Database
    database_url: str = "postgresql+asyncpg://stadiumos:stadiumos@localhost:5432/stadiumos"
    database_url_sync: str = "postgresql://stadiumos:stadiumos@localhost:5432/stadiumos"
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 50

    # AI Providers
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4-turbo"
    openai_max_tokens: int = 4096
    openai_temperature: float = 0.2

    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-1.5-pro"
    gemini_max_tokens: int = 4096
    gemini_temperature: float = 0.2

    ai_provider_primary: AIProvider = AIProvider.MOCK
    ai_provider_fallback: AIProvider = AIProvider.MOCK
    ai_rate_limit_per_minute: int = 60
    ai_cache_ttl_seconds: int = 300

    # Rate Limiting
    rate_limit_per_minute: int = 100
    rate_limit_per_minute_admin: int = 1000

    # Logging
    log_level: LogLevel = LogLevel.DEBUG
    enable_telemetry: bool = False

    # External APIs
    weather_api_key: Optional[str] = None
    weather_api_base_url: str = "https://api.weather.com/v1"
    traffic_api_key: Optional[str] = None
    traffic_api_base_url: str = "https://api.traffic.com/v1"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    def validate_production(self) -> list[str]:
        warnings: list[str] = []
        if self.environment == Environment.PRODUCTION:
            if self.auth_secret in ("change-me-to-a-random-secret", "", "secret"):
                warnings.append("AUTH_SECRET must be changed from default in production")
            if self.jwt_secret in ("change-me-to-another-random-secret", "", "secret"):
                warnings.append("JWT_SECRET must be changed from default in production")
            if not self.openai_api_key:
                warnings.append("OPENAI_API_KEY not configured")
            if not self.gemini_api_key:
                warnings.append("GEMINI_API_KEY not configured")
            if self.log_level == LogLevel.DEBUG:
                warnings.append("LOG_LEVEL should be INFO or higher in production")
            if self.cors_origins == "http://localhost:3000,http://localhost:8000":
                warnings.append("CORS origins should be restricted to production domains")
        return warnings


settings = Settings()

if settings.environment == Environment.PRODUCTION:
    validation_warnings = settings.validate_production()
    for warning in validation_warnings:
        logger.warning("Production config: %s", warning)
