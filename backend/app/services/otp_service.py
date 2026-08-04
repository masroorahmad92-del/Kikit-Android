from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import OTPSrcEnum
from app.core.security import create_access_token, create_refresh_token
from app.core.stream import generate_stream_token
from app.repositories.otp import create_otp, get_active_otp, mark_otp_used
from app.repositories.user import get_user_by_email
from app.schemas.user import UserInfo


def _build_auth_response(user) -> dict:
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "stream_chat_token": generate_stream_token(str(user.id)),
        "user": UserInfo.model_validate(user).model_dump(),
    }


def verify_otp_service(
    *,
    db: Session,
    recipient: str,
    code: str,
):
    """Verify the provided OTP code for the given recipient."""
    user = get_user_by_email(db, recipient)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = get_active_otp(db, recipient, code)
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    mark_otp_used(db, otp)
    return _build_auth_response(user)


def resend_otp_service(
    *,
    db: Session,
    recipient: str,
    source: OTPSrcEnum,
):
    """Resend an OTP code to the given recipient."""
    otp = create_otp(db, recipient, source)

    # sending email/SMS stays OUTSIDE router & service in prod
    return {
        "otp_bypass": False,
        "recipient": otp.recipient,
        "code": otp.code,  # ⚠️ only return in dev
    }
