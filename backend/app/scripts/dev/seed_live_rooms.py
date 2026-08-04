"""Seed safe App Review live rooms for a verified host.

Usage:
  python -m app.scripts.dev.seed_live_rooms reviewer@example.com
"""

import sys
from datetime import datetime, timezone

from app.core.enums import LiveRoomMemberRole, LiveRoomStatus
from app.database.session import SessionLocal
from app.models.interest_category import InterestCategory
from app.models.live_room import LiveRoom
from app.models.live_room_member import LiveRoomMember
from app.models.user import User
from app.services.live_room import _room_stream_id

ROOMS = [
    ("Music Hangout", "Music", "Share favorite tracks with verified members."),
    ("Travel Stories", "Travel", "Trade trip ideas and local tips."),
    ("Fitness Check-In", "Fitness", "Talk routines, accountability, and healthy habits."),
    ("Business Lounge", "Business", "Discuss projects, ideas, and professional growth."),
]


def main(host_email: str):
    db = SessionLocal()
    try:
        host = db.query(User).filter(User.email == host_email).first()
        if not host or not host.profile:
            raise RuntimeError(f"Host profile not found for {host_email}")
        if not host.profile.is_profile_verified:
            raise RuntimeError("Host must be profile verified before seeding live rooms")

        created = 0
        for title, category_name, description in ROOMS:
            existing = (
                db.query(LiveRoom)
                .filter(LiveRoom.host_user_id == host.id, LiveRoom.title == title)
                .first()
            )
            if existing:
                continue

            category = (
                db.query(InterestCategory)
                .filter(InterestCategory.name.ilike(category_name))
                .first()
            )
            room = LiveRoom(
                host_user_id=host.id,
                host_profile_id=host.profile.id,
                category_id=category.id if category else None,
                title=title,
                description=description,
                status=LiveRoomStatus.LIVE if created == 0 else LiveRoomStatus.SCHEDULED,
                stream_call_id="pending",
                stream_chat_channel_id="pending",
                started_at=datetime.now(timezone.utc) if created == 0 else None,
            )
            db.add(room)
            db.flush()
            room.stream_call_id = _room_stream_id(str(room.id))
            room.stream_chat_channel_id = f"{room.stream_call_id}_chat"
            db.add(
                LiveRoomMember(
                    room_id=room.id,
                    user_id=host.id,
                    role=LiveRoomMemberRole.HOST,
                    joined_at=room.started_at,
                )
            )
            created += 1

        db.commit()
        print(f"Seeded {created} live rooms for {host_email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m app.scripts.dev.seed_live_rooms reviewer@example.com")
    main(sys.argv[1])
