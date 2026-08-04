from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.enums import LiveRoomStatus
from app.core.logger import logger
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.live_room import LiveRoomCreate
from app.schemas.response import ResponseModel
from app.services.live_room import (
    create_live_room,
    end_live_room,
    join_live_room,
    leave_live_room,
    list_live_rooms,
    start_live_room,
)
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/live-rooms", tags=["Live Rooms"])


@router.get("", response_model=ResponseModel)
def get_live_rooms(
    category_id: UUID | None = None,
    status: LiveRoomStatus | None = None,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        data = list_live_rooms(db, current_user, category_id, status, limit, offset)
        return success_response(data=data, message="Live rooms fetched successfully")
    except Exception as exc:
        logger.exception("Failed to fetch live rooms")
        return error_response(
            message=getattr(exc, "detail", "Failed to fetch live rooms"),
            status_code=getattr(exc, "status_code", 500),
        )


@router.post("", response_model=ResponseModel)
def create_room(
    payload: LiveRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        data = create_live_room(db, current_user, payload)
        return success_response(data=data, message="Live room created successfully")
    except Exception as exc:
        logger.exception("Failed to create live room")
        return error_response(
            message=getattr(exc, "detail", "Failed to create live room"),
            status_code=getattr(exc, "status_code", 500),
        )


@router.post("/{room_id}/start", response_model=ResponseModel)
def start_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return success_response(
            data=start_live_room(db, current_user, room_id),
            message="Live room started",
        )
    except Exception as exc:
        logger.exception("Failed to start live room")
        return error_response(
            message=getattr(exc, "detail", "Failed to start live room"),
            status_code=getattr(exc, "status_code", 500),
        )


@router.post("/{room_id}/join", response_model=ResponseModel)
def join_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return success_response(
            data=join_live_room(db, current_user, room_id),
            message="Joined live room",
        )
    except Exception as exc:
        logger.exception("Failed to join live room")
        return error_response(
            message=getattr(exc, "detail", "Failed to join live room"),
            status_code=getattr(exc, "status_code", 500),
        )


@router.post("/{room_id}/leave", response_model=ResponseModel)
def leave_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return success_response(
            data=leave_live_room(db, current_user, room_id),
            message="Left live room",
        )
    except Exception as exc:
        logger.exception("Failed to leave live room")
        return error_response(
            message=getattr(exc, "detail", "Failed to leave live room"),
            status_code=getattr(exc, "status_code", 500),
        )


@router.post("/{room_id}/end", response_model=ResponseModel)
def end_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return success_response(
            data=end_live_room(db, current_user, room_id),
            message="Live room ended",
        )
    except Exception as exc:
        logger.exception("Failed to end live room")
        return error_response(
            message=getattr(exc, "detail", "Failed to end live room"),
            status_code=getattr(exc, "status_code", 500),
        )
