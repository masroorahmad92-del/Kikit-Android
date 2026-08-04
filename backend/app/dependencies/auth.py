from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.cache import cache_delete, cache_get, cache_set
from app.core.security import decode_token
from app.database.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/otp/verify")

_CACHE_TTL = 300  # 5 minutes


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that retrieves the authenticated user from the JWT token.
    Caches active status in Redis to reduce DB load on every request.
    """
    payload = decode_token(token, expected_type="access")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    cached = cache_get(f"user:{user_id}")
    if cached is not None:
        if not cached.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )
        user = db.get(User, user_id)
        if not user:
            cache_delete(f"user:{user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        # Re-check live is_active — cache may be stale if the user was recently banned
        if not user.is_active:
            cache_delete(f"user:{user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )
        return user

    # Cache miss — full query
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    cache_set(f"user:{user_id}", {"is_active": user.is_active}, ttl=_CACHE_TTL)
    return user
