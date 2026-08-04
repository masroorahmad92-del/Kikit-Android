from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user_preferences import UserPreferencesRead, UserPreferencesUpdate
from app.services.user_preferences_service import (
    delete_user_preferences_service,
    get_user_preferences_service,
    update_user_preferences_service,
)

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("/me", response_model=UserPreferencesRead)
def read_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPreferencesRead:
    """Retrieve the current user's preferences."""
    return get_user_preferences_service(db, current_user.id)


@router.put("/me", response_model=UserPreferencesRead)
def update_preferences(
    payload: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPreferencesRead:
    """Update the current user's preferences."""
    return update_user_preferences_service(db, current_user.id, payload)


@router.delete("/me", status_code=204)
def delete_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete the current user's preferences."""
    delete_user_preferences_service(db, current_user.id)
