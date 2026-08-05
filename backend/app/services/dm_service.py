from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.stream import create_dm_channel_id, stream_client
from app.models.user import User
from app.repositories.profile import get_profile_by_user_id
from app.repositories.user import get_user_by_id
from app.repositories.user_block import is_user_blocked_between
from app.utils.photos import get_best_photo


def create_one_to_one_channel_service(
    *,
    db: Session,
    current_user: User,
    other_user_id: str,
):
    """Create a one-to-one chat channel between the current user and another user."""

    # Cannot chat with yourself
    if str(current_user.id) == str(other_user_id):
        raise HTTPException(
            status_code=400,
            detail="You cannot create a channel with yourself.",
        )

    # Fetch other user
    other_user = get_user_by_id(db, other_user_id)
    if not other_user:
        raise HTTPException(
            status_code=404,
            detail="User does not exist.",
        )

    if is_user_blocked_between(db, current_user.id, other_user.id):
        raise HTTPException(
            status_code=403,
            detail="You cannot create a chat with this user.",
        )

    # Fetch profiles
    my_profile = get_profile_by_user_id(db, current_user.id)
    other_profile = get_profile_by_user_id(db, other_user.id)

    if not my_profile or not other_profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found for one or more users.",
        )

    channel_id = create_dm_channel_id(
        str(current_user.id),
        str(other_user.id),
    )

    members = [str(current_user.id), str(other_user.id)]
    photo_a = get_best_photo(my_profile)
    photo_b = get_best_photo(other_profile)

    stream_client.upsert_users(
        [
            {
                "id": str(current_user.id),
                "name": my_profile.name,
                "image": photo_a or None,
            },
            {
                "id": str(other_user.id),
                "name": other_profile.name,
                "image": photo_b or None,
            },
        ]
    )

    channel = stream_client.channel(
        channel_type="messaging",
        channel_id=channel_id,
        data={
            "members": members,
            "profile_ids": {
                str(current_user.id): str(my_profile.id),
                str(other_user.id): str(other_profile.id),
            },
            "profile_photos": {
                str(current_user.id): photo_a,
                str(other_user.id): photo_b,
            },
            "image": photo_b,
        },
    )

    # Idempotent: returns existing channel if already created
    channel.create(user_id=str(current_user.id))

    return {
        "channel_id": channel_id,
        "members": members,
        "profile_ids": {
            str(current_user.id): str(my_profile.id),
            str(other_user.id): str(other_profile.id),
        },
    }
