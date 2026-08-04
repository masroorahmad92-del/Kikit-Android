from sqlalchemy.orm import Session

from app.core.logger import logger
from app.core.stream import create_dm_channel_id, stream_client
from app.repositories.profile import get_profile_by_user_id
from app.utils.photos import get_best_photo


def create_one_to_one_channel(
    db: Session,
    user_a_id: str,
    user_b_id: str,
    spark_context: dict | None = None,
) -> str:
    if str(user_a_id) == str(user_b_id):
        raise ValueError("Cannot create channel with yourself")

    # Fetch profiles synchronously (fast DB read)
    profile_a = get_profile_by_user_id(db, user_a_id)
    profile_b = get_profile_by_user_id(db, user_b_id)
    if not profile_a or not profile_b:
        raise ValueError("Profile not found for one or more users")

    # Extract all needed data before threading (ORM objects are not thread-safe)
    channel_id = create_dm_channel_id(user_a_id, user_b_id)
    members = [str(user_a_id), str(user_b_id)]
    photo_a = get_best_photo(profile_a)
    photo_b = get_best_photo(profile_b)
    channel_data = {
        "members": members,
        "profile_ids": {
            str(user_a_id): str(profile_a.id),
            str(user_b_id): str(profile_b.id),
        },
        "profile_photos": {str(user_a_id): photo_a, str(user_b_id): photo_b},
        "image": photo_b,
    }
    if spark_context:
        channel_data["spark_context"] = spark_context
    users_payload = [
        {"id": str(user_a_id), "name": profile_a.name, "image": photo_a},
        {"id": str(user_b_id), "name": profile_b.name, "image": photo_b},
    ]

    try:
        stream_client.upsert_users(users_payload)
        channel = stream_client.channel(
            channel_type="messaging", channel_id=channel_id, data=channel_data
        )
        channel.create(user_id=str(user_a_id))
        logger.info(
            "Ensured Stream channel %s for users %s and %s",
            channel_id,
            user_a_id,
            user_b_id,
        )
    except Exception:
        logger.exception(
            "Failed to create Stream channel %s for users %s and %s",
            channel_id,
            user_a_id,
            user_b_id,
        )

    return channel_id


def delete_one_to_one_channel(user_a_id: str, user_b_id: str):
    import threading

    channel_id = create_dm_channel_id(user_a_id, user_b_id)

    def _delete():
        try:
            channel = stream_client.channel(
                channel_type="messaging", channel_id=channel_id
            )
            channel.delete()
        except Exception:
            logger.warning("Failed to delete channel %s", channel_id)

    threading.Thread(target=_delete, daemon=True).start()
