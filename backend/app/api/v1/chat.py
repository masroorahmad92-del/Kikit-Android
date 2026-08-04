from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.stream import StreamChannelResponse
from app.services.dm_service import create_one_to_one_channel_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/create/{other_user_id}", response_model=StreamChannelResponse)
async def create_one_to_one_channel(
    other_user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamChannelResponse:
    """Create a one-to-one chat channel between the current user and another user."""
    return create_one_to_one_channel_service(
        db=db,
        current_user=current_user,
        other_user_id=other_user_id,
    )
