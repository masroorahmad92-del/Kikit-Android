from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core import settings
from app.core.cache import cache_delete
from app.core.enums import OTPSrcEnum
from app.core.security import create_access_token, create_refresh_token
from app.core.stream import generate_stream_token
from app.models.user import User
from app.repositories.user import (
    authenticate_user,
    create_user,
    delete_user,
    generate_and_send_otp,
    update_user_balance,
)
from app.schemas.user import UserInfo
from app.tasks.stream_chat import delete_stream_chat_user, upsert_stream_chat_user


def signup_service(db: Session, user_data) -> User:
    try:
        new_user = create_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Upsert Stream Chat user via Celery — retryable, non-blocking
    upsert_stream_chat_user.delay(str(new_user.id))
    return new_user


def login_service(db: Session, user_data) -> dict:
    try:
        authenticated_user = authenticate_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    if authenticated_user.email.lower() in settings.OTP_BYPASS_EMAIL_SET:
        access_token = create_access_token({"sub": str(authenticated_user.id)})
        refresh_token = create_refresh_token({"sub": str(authenticated_user.id)})
        return {
            "otp_bypass": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "stream_chat_token": generate_stream_token(str(authenticated_user.id)),
            "user": UserInfo.model_validate(authenticated_user).model_dump(),
        }

    generate_and_send_otp(
        db, recipient=authenticated_user.email, source=OTPSrcEnum.EMAIL
    )
    return {"otp_bypass": False, "recipient": authenticated_user.email}


def delete_account_service(db: Session, user: User):
    user_id = str(user.id)
    delete_user(db, user)
    cache_delete(f"user:{user_id}")

    # Remove Stream Chat user via Celery — retryable, non-blocking
    delete_stream_chat_user.delay(user_id)
    return True


def update_balance_service(
    db: Session, user: User, coins: int | None, diamonds: int | None
) -> User:
    try:
        return update_user_balance(db, user, coins, diamonds)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
