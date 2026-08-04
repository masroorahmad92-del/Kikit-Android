from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.stream import create_dm_channel_id, stream_client
from app.models.user import User
from app.repositories.profile import get_profile_by_user_id
from app.repositories.user import get_user_by_id
from app.repositories.user_block import is_user_blocked_between


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

    channel = stream_client.channel(
        channel_type="messaging",
        channel_id=channel_id,
        data={
            "members": members,
            "profile_ids": {
                str(current_user.id): str(my_profile.id),
                str(other_user.id): str(other_profile.id),
            },
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
