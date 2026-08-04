from uuid import UUID

from sqlalchemy.orm import Session

from app.models.announcement import Announcement
from app.models.gift import Gift


def create_gift_announcement(
    db: Session,
    sender_id: UUID,
    receiver_id: UUID,
    gift: Gift,
    message: str | None = None,
):
    announcement = Announcement(
        sender_id=sender_id,
        receiver_id=receiver_id,
        gift_id=gift.id,
        message=message,
    )

    db.add(announcement)
    db.flush()


def get_announcements(db: Session, limit: int = 20):
    return (
        db.query(Announcement)
        .order_by(Announcement.created_at.desc())
        .limit(limit)
        .all()
    )
