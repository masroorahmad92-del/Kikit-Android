import json

import redis

from app.core import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


def cache_get(key: str):
    try:
        value = get_redis().get(key)  # type: ignore[union-attr]
        return json.loads(value) if value else None  # type: ignore[arg-type]
    except Exception:
        return None


def cache_set(key: str, value, ttl: int = 3600):
    try:
        get_redis().setex(key, ttl, json.dumps(value))
    except Exception:
        pass


def cache_delete(key: str):
    try:
        get_redis().delete(key)
    except Exception:
        pass


def cache_delete_pattern(pattern: str):
    """Delete all keys matching a glob pattern (e.g. 'announcements:*')."""
    try:
        client = get_redis()
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)  # type: ignore[misc]
    except Exception:
        pass


def cache_increment(key: str) -> int:
    """Atomically increment an integer counter. Returns the new value, or 0 on error."""
    try:
        return get_redis().incr(key)  # type: ignore[return-value]
    except Exception:
        return 0
