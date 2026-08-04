from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.device import (
    create_device,
    delete_device,
    delete_devices_by_user,
    get_device_by_fcm_token,
)


def register_device(db: Session, user_id: str | UUID, fcm_token: str):
    """Register or update the FCM token for a user."""
    device = get_device_by_fcm_token(db, fcm_token)

    if device:
        if device.user_id != user_id:
            device.user_id = user_id
            db.commit()
            db.refresh(device)  # keep device state in sync
    else:
        create_device(db, user_id, fcm_token)

    return {"success": True, "message": "FCM token registered"}


def unregister_device(db: Session, fcm_token: str) -> dict:
    """Unregister a device by FCM token (e.g., on logout)."""
    deleted = delete_device(db, fcm_token)
    if deleted:
        return {"success": True, "message": "Device unregistered"}
    return {"success": False, "message": "Device not found"}


def unregister_all_devices(db: Session, user_id: str | UUID) -> dict:
    """Unregister all devices for a user (e.g., on logout from all devices)."""
    count = delete_devices_by_user(db, user_id)
    return {"success": True, "message": f"{count} device(s) unregistered"}
