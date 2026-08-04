import logging

from fastapi import Depends, HTTPException, Request, status

from app.core.cache import get_redis

_log = logging.getLogger(__name__)


def _check_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """
    Increment a Redis counter for `key` and raise 429 if it exceeds `max_requests`
    within `window_seconds`. If Redis is unavailable the check is silently skipped
    so a cache outage never takes down the API.
    """
    try:
        client = get_redis()
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        count, _ = pipe.execute()
        if count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        _log.error("Rate limit check failed (Redis unavailable?): %s", exc)


def ip_rate_limit(key_prefix: str, max_requests: int, window_seconds: int):
    """
    Returns a FastAPI dependency that rate-limits by client IP.

    Usage:
        @router.post("/login", dependencies=[Depends(ip_rate_limit("login", 10, 60))])
    """

    def dependency(request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        _check_rate_limit(f"rl:{key_prefix}:{ip}", max_requests, window_seconds)

    return dependency


def user_rate_limit(key_prefix: str, max_requests: int, window_seconds: int):
    """
    Returns a FastAPI dependency that rate-limits by authenticated user ID.
    Prefer this over ip_rate_limit for authenticated endpoints so users behind
    a shared proxy/load-balancer don't share the same bucket.

    Usage:
        @router.post("/payout", dependencies=[Depends(user_rate_limit("payout", 5, 3600))])
    """
    from app.dependencies.auth import get_current_user

    def dependency(current_user=Depends(get_current_user)) -> None:
        _check_rate_limit(
            f"rl:{key_prefix}:user:{current_user.id}", max_requests, window_seconds
        )

    return dependency
