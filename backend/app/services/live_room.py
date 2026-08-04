import hashlib
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.enums import LiveRoomMemberRole, LiveRoomStatus
from app.core.logger import logger
from app.core.stream import stream_client
from app.models.interest_category import InterestCategory
from app.models.live_room import LiveRoom
from app.models.live_room_member import LiveRoomMember
from app.models.user import User
from app.repositories.user_block import is_user_blocked_between
from app.schemas.live_room import LiveRoomCreate
from app.utils.photos import get_best_photo


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _room_stream_id(room_id: str) -> str:
    digest = hashlib.sha256(room_id.encode()).hexdigest()[:32]
    return f"live_{digest}"


def _ensure_verified(user: User):
    if not user.profile or not user.profile.is_profile_complete:
        raise HTTPException(403, "Complete your profile before using Live Rooms")
    if not user.profile.is_profile_verified:
        raise HTTPException(403, "Verified members only. Please verify your profile first")


def _serialize_room(room: LiveRoom, current_user_id: UUID) -> dict:
    host_profile = room.host_profile
    current_user_id_str = str(current_user_id)
    return {
        "id": room.id,
        "title": room.title,
        "description": room.description,
        "status": room.status,
        "category_id": room.category_id,
        "category_name": room.category.name if room.category else None,
        "host_user_id": room.host_user_id,
        "host_profile_id": room.host_profile_id,
        "host_name": host_profile.name if host_profile else "Kikit Host",
        "host_photo": get_best_photo(host_profile),
        "host_verified": bool(host_profile and host_profile.is_profile_verified),
        "stream_call_id": room.stream_call_id,
        "stream_chat_channel_id": room.stream_chat_channel_id,
        "viewer_count": room.viewer_count,
        "gift_count": room.gift_count,
        "scheduled_for": room.scheduled_for,
        "started_at": room.started_at,
        "ended_at": room.ended_at,
        "is_host": str(room.host_user_id) == current_user_id_str,
        "is_member": any(
            str(member.user_id) == current_user_id_str and member.left_at is None
            for member in room.members
        ),
    }


def _room_query(db: Session):
    return db.query(LiveRoom).options(
        joinedload(LiveRoom.host_profile),
        joinedload(LiveRoom.category),
        joinedload(LiveRoom.members),
    )


def _ensure_stream_room_channel(room: LiveRoom):
    channel = stream_client.channel(
        channel_type="livestream",
        channel_id=room.stream_chat_channel_id,
        data={
            "name": room.title,
            "members": [str(room.host_user_id)],
            "live_room_id": str(room.id),
            "category": room.category.name if room.category else None,
        },
    )
    channel.create(user_id=str(room.host_user_id))


def list_live_rooms(
    db: Session,
    current_user: User,
    category_id: UUID | None = None,
    status: LiveRoomStatus | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    _ensure_verified(current_user)
    query = _room_query(db).filter(LiveRoom.is_active == True)
    if category_id:
        query = query.filter(LiveRoom.category_id == category_id)
    if status:
        query = query.filter(LiveRoom.status == status)
    else:
        query = query.filter(
            LiveRoom.status.in_([LiveRoomStatus.LIVE, LiveRoomStatus.SCHEDULED])
        )

    rooms = (
        query.order_by(
            LiveRoom.status.asc(),
            LiveRoom.started_at.desc().nullslast(),
            LiveRoom.created_at.desc(),
        )
        .offset(offset)
        .limit(limit + 1)
        .all()
    )
    visible_rooms = [
        room
        for room in rooms
        if str(room.host_user_id) == str(current_user.id)
        or not is_user_blocked_between(db, current_user.id, room.host_user_id)
    ]
    page_rooms = visible_rooms[:limit]
    return {
        "rooms": [_serialize_room(room, current_user.id) for room in page_rooms],
        "limit": limit,
        "offset": offset,
        "has_more": len(visible_rooms) > limit,
    }


def create_live_room(db: Session, current_user: User, payload: LiveRoomCreate) -> dict:
    _ensure_verified(current_user)
    if payload.category_id:
        category = (
            db.query(InterestCategory)
            .filter(InterestCategory.id == payload.category_id)
            .first()
        )
        if category is None:
            raise HTTPException(404, "Interest category not found")

    room = LiveRoom(
        host_user_id=current_user.id,
        host_profile_id=current_user.profile.id,
        category_id=payload.category_id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        status=LiveRoomStatus.LIVE if payload.start_now else LiveRoomStatus.SCHEDULED,
        scheduled_for=payload.scheduled_for,
        started_at=_now() if payload.start_now else None,
        stream_call_id="pending",
        stream_chat_channel_id="pending",
    )
    db.add(room)
    db.flush()
    room.stream_call_id = _room_stream_id(str(room.id))
    room.stream_chat_channel_id = f"{room.stream_call_id}_chat"
    db.add(
        LiveRoomMember(
            room_id=room.id,
            user_id=current_user.id,
            role=LiveRoomMemberRole.HOST,
            joined_at=_now() if payload.start_now else None,
        )
    )
    db.commit()
    db.refresh(room)
    try:
        _ensure_stream_room_channel(room)
    except Exception:
        logger.exception("Failed to create Stream room channel %s", room.id)
    return _serialize_room(
        _room_query(db).filter(LiveRoom.id == room.id).first(), current_user.id
    )


def start_live_room(db: Session, current_user: User, room_id: UUID) -> dict:
    room = _get_room_for_action(db, current_user, room_id, host_only=True)
    if room.status == LiveRoomStatus.ENDED:
        raise HTTPException(400, "Ended rooms cannot be restarted")
    room.status = LiveRoomStatus.LIVE
    room.started_at = room.started_at or _now()
    for member in room.members:
        if str(member.user_id) == str(current_user.id):
            member.joined_at = member.joined_at or _now()
            member.left_at = None
    db.commit()
    db.refresh(room)
    try:
        _ensure_stream_room_channel(room)
    except Exception:
        logger.exception("Failed to ensure Stream room channel %s", room.id)
    return _serialize_room(room, current_user.id)


def join_live_room(db: Session, current_user: User, room_id: UUID) -> dict:
    room = _get_room_for_action(db, current_user, room_id)
    if room.status != LiveRoomStatus.LIVE:
        raise HTTPException(400, "This room is not live right now")
    if str(room.host_user_id) != str(current_user.id) and is_user_blocked_between(
        db, current_user.id, room.host_user_id
    ):
        raise HTTPException(403, "You cannot join this room")

    member = next(
        (item for item in room.members if str(item.user_id) == str(current_user.id)),
        None,
    )
    if member is None:
        db.add(
            LiveRoomMember(
                room_id=room.id,
                user_id=current_user.id,
                role=LiveRoomMemberRole.VIEWER,
                joined_at=_now(),
            )
        )
        if str(room.host_user_id) != str(current_user.id):
            room.viewer_count += 1
    else:
        if member.left_at is not None and str(room.host_user_id) != str(current_user.id):
            room.viewer_count += 1
        member.joined_at = member.joined_at or _now()
        member.left_at = None
    db.commit()
    return _serialize_room(_get_room_for_action(db, current_user, room_id), current_user.id)


def leave_live_room(db: Session, current_user: User, room_id: UUID) -> dict:
    room = _get_room_for_action(db, current_user, room_id)
    member = next(
        (item for item in room.members if str(item.user_id) == str(current_user.id)),
        None,
    )
    if member and member.left_at is None:
        member.left_at = _now()
        if member.role != LiveRoomMemberRole.HOST:
            room.viewer_count = max(0, room.viewer_count - 1)
    db.commit()
    return _serialize_room(_get_room_for_action(db, current_user, room_id), current_user.id)


def end_live_room(db: Session, current_user: User, room_id: UUID) -> dict:
    room = _get_room_for_action(db, current_user, room_id, host_only=True)
    room.status = LiveRoomStatus.ENDED
    room.ended_at = _now()
    room.viewer_count = 0
    for member in room.members:
        if member.left_at is None:
            member.left_at = _now()
    db.commit()
    return _serialize_room(_get_room_for_action(db, current_user, room_id), current_user.id)


def _get_room_for_action(
    db: Session, current_user: User, room_id: UUID, host_only: bool = False
) -> LiveRoom:
    _ensure_verified(current_user)
    room = (
        _room_query(db)
        .filter(LiveRoom.id == room_id, LiveRoom.is_active == True)
        .first()
    )
    if room is None:
        raise HTTPException(404, "Live room not found")
    if host_only and str(room.host_user_id) != str(current_user.id):
        raise HTTPException(403, "Only the room host can do this")
    return room
