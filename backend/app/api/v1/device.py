from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import User
from app.services.device import (
    register_device,
    unregister_all_devices,
    unregister_device,
)

router = APIRouter()


@router.post("/fcm-token")
def register_fcm_token(
    fcm_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Register or update the FCM token for the current user."""
    if not fcm_token:
        raise HTTPException(400, "FCM token is required")

    return register_device(
        db=db,
        user_id=current_user.id,
        fcm_token=fcm_token,
    )


@router.post("/logout")
def logout_device(
    fcm_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Unregister the current device (logout). Stops push notifications to this device."""
    if not fcm_token:
        raise HTTPException(400, "FCM token is required")

    return unregister_device(
        db=db,
        fcm_token=fcm_token,
    )


@router.post("/logout-all")
def logout_all_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Unregister all devices for the current user (logout from all devices)."""
    return unregister_all_devices(
        db=db,
        user_id=current_user.id,
    )
