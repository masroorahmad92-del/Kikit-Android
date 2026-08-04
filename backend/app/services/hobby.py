from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.repositories.hobby import get_all_hobbies as repo_get_all_hobbies
from app.schemas.hobby import HobbyCategoryRead

_CACHE_KEY = "hobbies:all"
_CACHE_TTL = 86400  # 24 hours — hobbies are static


def list_all_hobbies(db: Session):
    cached = cache_get(_CACHE_KEY)
    if cached is not None:
        return cached

    categories = repo_get_all_hobbies(db)
    serialized = [
        HobbyCategoryRead.model_validate(c, from_attributes=True).model_dump(
            mode="json"
        )
        for c in categories
    ]
    cache_set(_CACHE_KEY, serialized, ttl=_CACHE_TTL)
    return categories
