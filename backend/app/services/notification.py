from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.repositories.device import send_to_user
from app.repositories.notification import (
    create_notification,
    get_unread_count,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)


def notify_user(
    *,
    db: Session,
    user_id,
    title: str,
    body: str,
    type: str,
    data: dict | None = None,
) -> Notification:
    """
    Creates a notification and triggers push notification.
    Acts like Django post_save signal.
    """

    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        notification_type=type,
        data=data or {},
    )

    notification = create_notification(db, notification)

    send_to_user(
        db=db,
        user_id=user_id,
        title=title,
        body=body,
        data=data or {},
    )

    return notification


def get_user_notifications_service(db: Session, user_id):
    return get_user_notifications(db, user_id)


def get_unread_count_service(db: Session, user_id) -> int:
    return get_unread_count(db, user_id)


def mark_notification_read_service(db: Session, notification_id, user_id):
    return mark_notification_read(db, notification_id, user_id)


def mark_all_notifications_read_service(db: Session, user_id) -> None:
    mark_all_notifications_read(db, user_id)
