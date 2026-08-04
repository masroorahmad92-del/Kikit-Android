from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.announcement import AnnouncementResponse
from app.services.announcement import get_announcements

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("/", response_model=List[AnnouncementResponse])
def announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(
        20, ge=1, le=100, description="Max number of announcements to return"
    ),
) -> List[AnnouncementResponse]:
    """Retrieve a list of announcements."""
    return get_announcements(db, limit=limit)
