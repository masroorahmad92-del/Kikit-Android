from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, notification: Notification) -> Notification:
    """Create a new notification."""
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_user_notifications(
    db: Session, user_id, unread_only: bool = False
) -> list[Notification]:
    """Retrieve notifications for a user."""
    query = db.query(Notification).filter(Notification.user_id == user_id)

    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    return query.order_by(Notification.created_at.desc()).all()


def mark_notification_read(
    db: Session, notification_id, user_id
) -> Notification | None:
    """Mark a specific notification as read."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if notif:
        notif.is_read = True
        db.commit()
    return notif


def mark_all_notifications_read(db: Session, user_id) -> None:
    """Mark all notifications for a user as read."""
    (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({"is_read": True})
    )
    db.commit()


def get_unread_count(db: Session, user_id) -> int:
    """Get the count of unread notifications for a user."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )
