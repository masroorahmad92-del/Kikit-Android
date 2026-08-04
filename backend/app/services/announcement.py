from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_increment, cache_set
from app.repositories.announcement import get_announcements as repo_get_announcements
from app.schemas.announcement import AnnouncementResponse

_CACHE_TTL = 120  # 2 minutes — announcements update when gifts are sent
_VERSION_KEY = "announcements:version"


def invalidate_announcements_cache() -> None:
    """
    Bump the global version counter so all cached announcement pages become
    stale instantly. O(1) — one Redis INCR instead of an O(N) KEYS scan.
    """
    cache_increment(_VERSION_KEY)


def get_announcements(db: Session, limit: int = 20):
    version = cache_get(_VERSION_KEY) or 0
    cache_key = f"announcements:v{version}:{limit}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    announcements = repo_get_announcements(db, limit=limit)
    serialized = [
        AnnouncementResponse.model_validate(a, from_attributes=True).model_dump(
            mode="json"
        )
        for a in announcements
    ]
    cache_set(cache_key, serialized, ttl=_CACHE_TTL)
    return serialized
