from sqlalchemy.orm import Session

from app.auth.apple import verify_apple_token
from app.core.stream import generate_stream_token
from app.repositories.profile import create_or_update_profile
from app.repositories.user import (
    create_user_from_kwargs,
    get_user_by_apple_id,
    get_user_by_email,
    update_user,
)
from app.schemas.user import UserInfo
from app.services.token_service import generate_auth_tokens


async def apple_login(id_token: str, db: Session, full_name: str | None = None):
    """Authenticate or register a user via Apple SSO and return auth tokens."""
    user_data = await verify_apple_token(id_token)

    user = get_user_by_apple_id(db, user_data["apple_id"])

    if not user:
        user = get_user_by_email(db, user_data["email"])
        if user:
            user.apple_id = user_data["apple_id"]
            user = update_user(db, user)
        else:
            user = create_user_from_kwargs(
                db,
                email=user_data["email"],
                apple_id=user_data["apple_id"],
                email_verified=user_data["email_verified"],
            )

    normalized_name = (full_name or "").strip()
    if normalized_name:
        profile = user.profile
        if profile is None or not profile.name:
            create_or_update_profile(db, user.id, {"name": normalized_name})

    tokens = generate_auth_tokens(str(user.id))
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "stream_chat_token": generate_stream_token(str(user.id)),
        "user": UserInfo.model_validate(user).model_dump(),
        "auth_provider": "apple",
    }
