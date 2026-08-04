from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import OTPSrcEnum
from app.repositories.otp import create_dev_otp, get_active_otp, mark_otp_used
from app.repositories.phone_verification import (
    get_profile_by_phone,
    mark_phone_verified,
)
from app.repositories.profile import get_profile_by_user_id


def check_phone_exists_service(
    *,
    db: Session,
    phone_number: str,
) -> dict:
    """Check if a phone number is already registered."""
    profile = get_profile_by_phone(db, phone_number)
    return {
        "exists": profile is not None,
        "phone_number": phone_number,
    }


def send_phone_otp_service(
    *,
    db: Session,
    user_id: str,
):
    profile = get_profile_by_user_id(db, user_id)
    if not profile or not profile.phone_number:
        raise HTTPException(
            status_code=404,
            detail="Phone number not found for user",
        )

    create_dev_otp(
        db,
        recipient=profile.phone_number,
        source=OTPSrcEnum.PHONE,
    )

    # In prod, SMS sending happens via notification service
    return {
        "phone_number": profile.phone_number,
    }


def verify_phone_otp_service(
    *,
    db: Session,
    user_id: str,
    code: str,
):
    profile = get_profile_by_user_id(db, user_id)
    if not profile or not profile.phone_number:
        raise HTTPException(
            status_code=404,
            detail="Phone number not found for user",
        )

    otp = get_active_otp(
        db,
        profile.phone_number,
        code,
    )
    if not otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP",
        )

    mark_otp_used(db, otp)
    mark_phone_verified(db, profile)

    return True
