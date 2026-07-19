import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.cache import close_cache, init_cache
from app.core.errors import (
    HTTPException,
    StadiumOSError,
    global_exception_handler,
    http_exception_handler,
    stadiumos_error_handler,
)
from app.core.event_bus import event_bus
from app.core.logging import setup_logging
from app.modules.crowd.router import router as crowd_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")

    await init_cache()

    event_bus.start()

    if os.environ.get("STADIUMOS_METRICS_ENABLED", "").lower() == "true":
        from app.monitoring.metrics import setup_metrics
        setup_metrics(app)
        logger.info("Metrics enabled")

    yield

    event_bus.stop()
    await close_cache()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID", "X-Request-Duration-Ms"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],
)


app.add_exception_handler(StadiumOSError, stadiumos_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.include_router(crowd_router, prefix=settings.api_prefix)

@app.get(f"{settings.api_prefix}/health", tags=["System"])
async def health_check():
    import time
    db_healthy = False
    redis_healthy = False

    try:
        from app.core.database import get_db
        async for _ in get_db():
            db_healthy = True
            break
    except Exception:
        db_healthy = False

    try:
        from app.core.cache import get_cache
        cache = get_cache()
        await cache.ping()
        redis_healthy = True
    except Exception:
        redis_healthy = False

    return {
        "status": "healthy" if (db_healthy or settings.environment.value == "development") else "degraded",
        "version": settings.app_version,
        "environment": settings.environment.value,
        "timestamp": time.time(),
        "checks": {
            "database": "healthy" if db_healthy else "unhealthy",
            "redis": "healthy" if redis_healthy else "unhealthy",
        },
    }


@app.get(f"{settings.api_prefix}/ready", tags=["System"])
async def readiness_check():
    return {"status": "ready", "version": settings.app_version}


@app.get(f"{settings.api_prefix}/live", tags=["System"])
async def liveness_check():
    return {"status": "alive"}


@app.get(f"{settings.api_prefix}", tags=["System"])
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment.value,
        "docs": f"{settings.api_prefix}/docs",
    }
