from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, decode_token
from app.repositories.user import get_user_by_id


def refresh_tokens(refresh_token: str, db: Session):
    """Refresh access and refresh tokens using the provided refresh token."""
    payload = decode_token(refresh_token, expected_type="refresh")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
    }


def generate_auth_tokens(user_id: str):
    """Generate access and refresh tokens for a given user ID."""
    return {
        "access_token": create_access_token({"sub": user_id}),
        "refresh_token": create_refresh_token({"sub": user_id}),
    }
