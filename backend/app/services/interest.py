from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.repositories.interest import get_all_interests as repo_get_all_interests
from app.schemas.interest import InterestCategoryRead

_CACHE_KEY = "interests:all"
_CACHE_TTL = 86400  # 24 hours — interests are static


def list_all_interests(db: Session):
    cached = cache_get(_CACHE_KEY)
    if cached is not None:
        return cached

    categories = repo_get_all_interests(db)
    serialized = [
        InterestCategoryRead.model_validate(c, from_attributes=True).model_dump(
            mode="json"
        )
        for c in categories
    ]
    cache_set(_CACHE_KEY, serialized, ttl=_CACHE_TTL)
    return categories
