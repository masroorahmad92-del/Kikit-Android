from typing import List

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileRead
from app.schemas.response import ResponseModel
from app.services.match_service import get_user_discover, get_user_matches
from app.utils.response import success_response

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("/discover", response_model=ResponseModel)
def get_discover_matches(
    interest_id: UUID | None = Query(None),
    category_id: UUID | None = Query(None),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Retrieve interest-first Discover profiles."""
    data = get_user_discover(
        db=db,
        current_user=current_user,
        interest_id=interest_id,
        category_id=category_id,
        limit=limit,
        offset=offset,
    )
    return success_response(message="Discover profiles fetched successfully", data=data)


@router.get("/", response_model=List[ProfileRead])
def get_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 999,
) -> List[ProfileRead]:
    """Retrieve a list of user profiles that match the current user's preferences."""
    profiles = get_user_matches(
        db=db,
        current_user=current_user,
        limit=limit,
    )

    return [ProfileRead.model_validate(p, from_attributes=True) for p in profiles]
