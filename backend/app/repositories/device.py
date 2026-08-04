from uuid import UUID

from sqlalchemy.orm import Session

from app.core.logger import logger
from app.models import Device
from app.utils.push_notification import send_push_notification


def get_device_by_user_and_token(
    db: Session, user_id: int, fcm_token: str
) -> Device | None:
    return (
        db.query(Device)
        .filter(Device.user_id == user_id, Device.fcm_token == fcm_token)
        .first()
    )


def create_device(db: Session, user_id: str | UUID, fcm_token: str) -> Device:
    device = Device(
        user_id=user_id,
        fcm_token=fcm_token,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def create_or_update_device(db: Session, user_id: int, fcm_token: str) -> Device:
    device = db.query(Device).filter(Device.fcm_token == fcm_token).first()

    if device:
        device.user_id = user_id
    else:
        device = Device(
            user_id=user_id,
            fcm_token=fcm_token,
        )
        db.add(device)

    db.commit()
    db.refresh(device)
    return device


def get_device_by_fcm_token(db: Session, fcm_token):
    return db.query(Device).filter(Device.fcm_token == fcm_token).first()


def get_all_devices(db: Session):
    return db.query(Device).all()


def get_devices_by_user(db: Session, user_id: str | UUID):
    return db.query(Device).filter(Device.user_id == user_id).all()


def delete_device(db: Session, fcm_token: str) -> bool:
    """Delete a device by FCM token. Returns True if deleted, False if not found."""
    device = db.query(Device).filter(Device.fcm_token == fcm_token).first()
    if device:
        db.delete(device)
        db.commit()
        return True
    return False


def delete_devices_by_user(db: Session, user_id: str | UUID) -> int:
    """Delete all devices for a user. Returns count of deleted devices."""
    devices = db.query(Device).filter(Device.user_id == user_id).all()
    count = len(devices)
    for device in devices:
        db.delete(device)
    db.commit()
    return count


def send_to_user(
    db: Session, user_id: str | UUID, title: str, body: str, data: dict | None = None
):
    device = (
        db.query(Device)
        .filter(Device.user_id == user_id)
        .order_by(Device.created_at.desc())
        .first()
    )

    if not device:
        logger.warning("No device found for user %s", user_id)
        return

    try:
        send_push_notification(
            fcm_token=device.fcm_token,
            title=title,
            body=body,
            data=data,
        )
    except Exception as e:
        logger.error(
            "Failed to send notification to user %s on device %s: %s",
            user_id,
            device.fcm_token,
            e,
        )
