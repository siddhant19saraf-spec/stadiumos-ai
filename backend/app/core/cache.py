from typing import Any, Optional

import redis.asyncio as redis
from app.core.config import settings

redis_client: Optional[redis.Redis] = None


async def init_cache() -> None:
    global redis_client
    try:
        redis_client = redis.from_url(
            settings.redis_url,
            max_connections=settings.redis_max_connections,
            decode_responses=True,
        )
        await redis_client.ping()
    except redis.ConnectionError:
        redis_client = None


async def close_cache() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def get_cache() -> Optional[redis.Redis]:
    return redis_client


async def cache_get(key: str) -> Optional[str]:
    if redis_client is None:
        return None
    try:
        return await redis_client.get(key)
    except redis.RedisError:
        return None


async def cache_set(key: str, value: str, ttl: int = settings.ai_cache_ttl_seconds) -> bool:
    if redis_client is None:
        return False
    try:
        await redis_client.setex(key, ttl, value)
        return True
    except redis.RedisError:
        return False


async def cache_delete(key: str) -> bool:
    if redis_client is None:
        return False
    try:
        await redis_client.delete(key)
        return True
    except redis.RedisError:
        return False


async def cache_delete_pattern(pattern: str) -> int:
    if redis_client is None:
        return 0
    try:
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = await redis_client.scan(cursor=cursor, match=pattern)
            if keys:
                deleted += await redis_client.delete(*keys)
            if cursor == 0:
                break
        return deleted
    except redis.RedisError:
        return 0
