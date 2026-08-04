from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.cache import cache_delete, cache_get, cache_set
from app.repositories.user_preferences import (
    create_or_update_user_preferences,
    delete_user_preferences,
    get_user_preferences,
)
from app.schemas.user_preferences import UserPreferencesRead, UserPreferencesUpdate

_CACHE_TTL = 3600  # 1 hour


def _cache_key(user_id: str | UUID | UUID) -> str:
    return f"preferences:{user_id}"


def get_user_preferences_service(
    db: Session,
    user_id: str | UUID,
):
    cached = cache_get(_cache_key(user_id))
    if cached is not None:
        return cached

    prefs = get_user_preferences(db, user_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not set")

    serialized = UserPreferencesRead.model_validate(
        prefs, from_attributes=True
    ).model_dump(mode="json")
    cache_set(_cache_key(user_id), serialized, ttl=_CACHE_TTL)
    return prefs


def update_user_preferences_service(
    db: Session,
    user_id: str | UUID,
    payload: UserPreferencesUpdate,
):
    prefs = create_or_update_user_preferences(
        db,
        user_id,
        payload.model_dump(exclude_unset=True),
    )
    cache_delete(_cache_key(user_id))
    return prefs


def delete_user_preferences_service(
    db: Session,
    user_id: str | UUID,
):
    result = delete_user_preferences(db, user_id)
    cache_delete(_cache_key(user_id))
    return result
