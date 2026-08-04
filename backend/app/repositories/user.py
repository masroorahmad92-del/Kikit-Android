from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import OTPSrcEnum
from app.core.logger import logger
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.otp import create_otp, send_otp_email
from app.schemas.user import UserAuthData
from app.utils.photos import get_best_photo


def create_user(db: Session, user: UserAuthData) -> User:
    """
    Create a new user with hashed password. Raises HTTPException on failure.
    """
    try:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        hashed_pw = hash_password(user.password)
        db_user = User(email=user.email, password=hashed_pw)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except HTTPException as ex:
        raise ex
    except Exception as ex:
        logger.error(f"Error creating user: {ex}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        ) from ex


def authenticate_user(db: Session, user_data: UserAuthData) -> User:
    """
    Authenticate user by email and password. Raises HTTPException on failure.
    """
    try:
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user or not verify_password(user_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
            )

        return user

    except HTTPException as ex:
        raise ex
    except Exception as ex:
        logger.error(f"Authentication error: {ex}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
        ) from ex


def get_user_by_email(db, recipient) -> User | None:
    """
    Fetch a user by their email address.
    """
    return db.query(User).filter(User.email == recipient).first()


def get_user_by_id(db: Session, user_id: str | UUID) -> User | None:
    """
    Fetch a user by their ID.
    """
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_google_id(db: Session, google_id: str) -> User | None:
    return db.query(User).filter(User.google_id == google_id).first()


def get_user_by_apple_id(db: Session, apple_id: str) -> User | None:
    return db.query(User).filter(User.apple_id == apple_id).first()


def get_user_by_trolley_recipient_id(db: Session, recipient_id: str) -> User | None:
    return db.query(User).filter(User.trolley_recipient_id == recipient_id).first()


def create_user_from_kwargs(db: Session, **kwargs) -> User:
    user = User(**kwargs)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User) -> User:
    db.commit()
    db.refresh(user)
    return user


def update_user_balance(
    db: Session, user: User, coins: int | None, diamonds: int | None
) -> User:
    from app.repositories.coin_transaction import (
        log_coin_transaction,
        log_diamond_transaction,
    )

    if coins is not None:
        user.coin_balance += coins
        if user.coin_balance < 0:
            raise ValueError("Insufficient coin balance")
        log_coin_transaction(
            db, user_id=user.id, amount=coins, reason="admin_adjustment"
        )

    if diamonds is not None:
        user.diamond_balance += diamonds
        if user.diamond_balance < 0:
            raise ValueError("Insufficient diamond balance")
        log_diamond_transaction(
            db, user_id=user.id, amount=diamonds, reason="admin_adjustment"
        )

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User):
    db.delete(user)
    db.commit()
    return True


def generate_and_send_otp(db: Session, recipient: str, source: OTPSrcEnum):
    otp = create_otp(db, recipient=recipient, source=source)
    send_otp_email(recipient, otp.code)
    return otp


def serialize_user(user: User | None) -> dict | None:
    """Convert a User object into a dictionary with selected fields."""
    if not user:
        return None

    profile = user.profile

    return {
        "user_id": user.id,
        "profile_id": profile.id if profile else None,
        "email": user.email,
        "name": profile.name if profile else None,
        "profile_image": get_best_photo(profile),
    }
