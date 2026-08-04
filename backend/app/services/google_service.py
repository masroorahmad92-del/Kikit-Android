from sqlalchemy.orm import Session

from app.auth.google import verify_google_token
from app.core.stream import generate_stream_token
from app.repositories.profile import create_or_update_profile
from app.repositories.user import (
    create_user_from_kwargs,
    get_user_by_email,
    get_user_by_google_id,
    update_user,
)
from app.schemas.user import UserInfo
from app.services.token_service import generate_auth_tokens


async def google_login(id_token: str, db: Session, full_name: str | None = None):
    """Authenticate or register a user via Google SSO and return auth tokens."""
    user_data = await verify_google_token(id_token)

    user = get_user_by_google_id(db, user_data["google_id"])

    if not user:
        user = get_user_by_email(db, user_data["email"])
        if user:
            user.google_id = user_data["google_id"]
            user = update_user(db, user)
        else:
            user = create_user_from_kwargs(
                db,
                email=user_data["email"],
                google_id=user_data["google_id"],
                email_verified=user_data["email_verified"],
            )

    resolved_name = (full_name or user_data.get("name") or "").strip()
    if resolved_name:
        profile = user.profile
        if profile is None or not profile.name:
            create_or_update_profile(db, user.id, {"name": resolved_name})

    tokens = generate_auth_tokens(str(user.id))
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "stream_chat_token": generate_stream_token(str(user.id)),
        "user": UserInfo.model_validate(user).model_dump(),
        "auth_provider": "google",
    }
