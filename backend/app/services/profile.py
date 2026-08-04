from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.enums import NotificationType, SubscriptionType
from app.core.logger import logger
from app.models import Interest, InterestCategory
from app.models.profile import Profile
from app.models.profile_likes import ProfileLike
from app.repositories.chat import create_one_to_one_channel, delete_one_to_one_channel
from app.repositories.profile import (
    add_purchased_calls,
    create_or_update_profile,
    get_profile_by_id,
    get_profile_by_user_id,
    increment_calls_taken,
    remove_profile_subscription,
    set_profile_subscription,
)
from app.repositories.profile_like import (
    create_or_update_spark_like,
    get_ignored_likers,
    get_profile_like,
    get_profiles_liked_by_user,
    get_users_who_liked_profile,
    has_liked,
    ignore_profile_like,
    toggle_profile_like,
    unignore_profile_like,
    unlike_profile,
)
from app.schemas.profile import ProfileRead
from app.services.notification import notify_user
from app.services.user_block import assert_users_not_blocked
from app.utils.distance import haversine_km
from app.utils.face_verification import verify_face
from app.utils.photos import get_best_photo


def _safe_notify_user(db: Session, **kwargs) -> None:
    try:
        notify_user(db=db, **kwargs)
    except Exception:
        db.rollback()
        logger.exception(
            "Failed to create/send notification for user %s and type %s",
            kwargs.get("user_id"),
            kwargs.get("type"),
        )


def _spark_context_from_like(like: ProfileLike | None) -> dict | None:
    if not like or not like.spark_answer:
        return None

    return {
        "interest_id": str(like.spark_interest_id) if like.spark_interest_id else None,
        "interest_name": like.spark_interest.name if like.spark_interest else None,
        "category_id": str(like.spark_category_id) if like.spark_category_id else None,
        "category_name": like.spark_category.name if like.spark_category else None,
        "question": like.spark_question,
        "answer": like.spark_answer,
        "created_from": like.spark_created_from,
        "from_profile_id": str(like.liker_id),
        "to_profile_id": str(like.liked_id),
    }


def _build_match_data(
    *,
    channel_id: str,
    current_user,
    my_profile: Profile,
    liked_profile: Profile,
    spark_context: dict | None = None,
) -> dict:
    match_data = {
        "channel_id": channel_id,
        "user1": {
            "user_id": str(current_user.id),
            "profile_id": str(my_profile.id),
            "name": str(my_profile.name),
            "photo": get_best_photo(my_profile),
        },
        "user2": {
            "user_id": str(liked_profile.user_id),
            "profile_id": str(liked_profile.id),
            "name": str(liked_profile.name),
            "photo": get_best_photo(liked_profile),
        },
    }
    if spark_context:
        match_data["spark_context"] = spark_context
    return match_data


def _preferred_spark_context(
    db: Session, my_profile: Profile, liked_profile: Profile
) -> dict | None:
    reciprocal_like = get_profile_like(db, liked_profile.id, my_profile.id)
    current_like = get_profile_like(db, my_profile.id, liked_profile.id)
    return _spark_context_from_like(reciprocal_like) or _spark_context_from_like(
        current_like
    )


async def update_profile_service(db: Session, user_id: str | UUID, data: dict):
    """Create or update a user's profile."""
    return create_or_update_profile(db, user_id, data)


def get_profile_service(db: Session, user_id: str | UUID):
    """Retrieve a user's profile."""
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")
    return profile


def _assert_profile_visible(
    db: Session, current_user_id: str | UUID | None, profile: Profile
) -> None:
    if current_user_id and str(profile.user_id) != str(current_user_id):
        assert_users_not_blocked(db, current_user_id, profile.user_id)


def get_profile_by_id_service(
    db: Session, profile_id: str, current_user_id: str | UUID | None = None
):
    """Retrieve a profile by its ID."""
    profile = get_profile_by_id(db, profile_id)

    if not profile:
        raise ValueError("Profile not found")
    _assert_profile_visible(db, current_user_id, profile)
    return profile


def get_profile_by_user_id_service(
    db: Session, user_id: str | UUID, current_user_id: str | UUID | None = None
):
    """Retrieve a profile by its user ID."""
    profile = get_profile_by_user_id(db, user_id)

    if not profile:
        raise ValueError("Profile not found")

    _assert_profile_visible(db, current_user_id, profile)
    return profile


def remove_subscription_service(db: Session, user_id: str | UUID):
    """Remove the subscription from a user's profile."""
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")
    return remove_profile_subscription(db, profile)


def increment_calls_service(db: Session, user_id: str | UUID):
    """Use one call. Purchased calls are consumed first, then subscription calls."""
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")
    return increment_calls_taken(db, profile)


def add_purchased_calls_service(db: Session, user_id: str | UUID, calls_count: int):
    """Grant one-time purchased calls to a user's profile."""
    if calls_count <= 0:
        raise ValueError("calls_count must be greater than 0")
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")
    return add_purchased_calls(db, profile, calls_count)


def set_subscription_service(
    db: Session, user_id: str | UUID, subscription_type: SubscriptionType
):
    """Set or update the subscription plan for a user's profile."""
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")
    return set_profile_subscription(db, profile, subscription_type)


async def verify_profile_service(
    db: Session, user_id: str | UUID, uploaded_file: UploadFile
):
    """Verify a user's profile using face verification."""
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")

    photo_records = profile.photos
    if not photo_records:
        raise ValueError("No profile photos found")

    stored_image_paths = [photo.url for photo in photo_records]
    uploaded_bytes = await uploaded_file.read()

    is_verified = await verify_face(uploaded_bytes, stored_image_paths)

    # Update profile verification status
    profile.is_profile_verified = bool(is_verified)
    db.commit()

    return bool(is_verified)


def like_profile(db: Session, current_user, profile_id: str):
    """Like or unlike a profile. Create/delete Stream channel on mutual likes."""
    my_profile = get_profile_by_user_id(db, current_user.id)
    if not my_profile:
        raise ValueError("Profile not found")
    liked_profile = get_profile_by_id(db, profile_id)
    if not liked_profile:
        raise ValueError("Profile not found")
    if my_profile.id == liked_profile.id:
        raise ValueError("You cannot like your own profile")
    assert_users_not_blocked(db, current_user.id, liked_profile.user_id)

    liked = toggle_profile_like(db, my_profile.id, profile_id)
    is_matched = False
    match_data = None
    channel_id = None

    if liked:
        logger.info("%s liked profile %s", current_user.id, liked_profile.user_id)
        is_mutual = has_liked(db, liked_profile.id, my_profile.id)
        if is_mutual:
            is_matched = True
            spark_context = _preferred_spark_context(db, my_profile, liked_profile)
            logger.info(
                "Creating mutual like channel between %s and %s",
                current_user.id,
                liked_profile.user_id,
            )
            channel_id = create_one_to_one_channel(
                db,
                current_user.id,
                liked_profile.user_id,
                spark_context=spark_context,
            )

            match_data = _build_match_data(
                channel_id=channel_id,
                current_user=current_user,
                my_profile=my_profile,
                liked_profile=liked_profile,
                spark_context=spark_context,
            )

        _safe_notify_user(
            db=db,
            user_id=liked_profile.user_id,
            title="New Like ❤️",
            body=f"{my_profile.name} liked your profile!",
            type=NotificationType.PROFILE_LIKE.value,
            data={
                "from_profile_id": str(my_profile.id),
                "from_user_id": str(current_user.id),
                "from_profile_photo": get_best_photo(my_profile),
                "from_profile_name": str(my_profile.name),
                "to_profile_id": str(liked_profile.id),
                "to_user_id": str(liked_profile.user_id),
                "to_profile_photo": get_best_photo(liked_profile),
                "to_profile_name": str(liked_profile.name),
            },
        )
    else:
        # ---------- UNLIKE ----------
        # If mutual like existed → delete channel
        if has_liked(db, liked_profile.id, my_profile.id):
            logger.info(
                "Checking for mutual like to delete channel between %s and %s",
                current_user.id,
                liked_profile.user_id,
            )
            delete_one_to_one_channel(
                str(current_user.id),
                str(liked_profile.user_id),
            )

    return liked, is_matched, match_data


def spark_profile(db: Session, current_user, profile_id: str, spark_data: dict):
    """Create or update a Spark like without toggling it off."""
    my_profile = get_profile_by_user_id(db, current_user.id)
    if not my_profile:
        raise ValueError("Profile not found")
    liked_profile = get_profile_by_id(db, profile_id)
    if not liked_profile:
        raise ValueError("Profile not found")
    if my_profile.id == liked_profile.id:
        raise ValueError("You cannot spark your own profile")
    assert_users_not_blocked(db, current_user.id, liked_profile.user_id)

    interest_id = spark_data.get("spark_interest_id")
    category_id = spark_data.get("spark_category_id")
    if interest_id:
        interest = db.query(Interest).filter(Interest.id == interest_id).first()
        if not interest:
            raise ValueError("Spark interest not found")
        if category_id and str(interest.category_id) != str(category_id):
            raise ValueError("Spark interest does not belong to this category")
        spark_data["spark_category_id"] = category_id or interest.category_id
    if spark_data.get("spark_category_id"):
        category = (
            db.query(InterestCategory)
            .filter(InterestCategory.id == spark_data["spark_category_id"])
            .first()
        )
        if not category:
            raise ValueError("Spark category not found")

    like, created = create_or_update_spark_like(
        db, my_profile.id, liked_profile.id, spark_data
    )
    is_matched = False
    match_data = None
    channel_id = None

    if has_liked(db, liked_profile.id, my_profile.id):
        is_matched = True
        spark_context = _preferred_spark_context(db, my_profile, liked_profile)
        channel_id = create_one_to_one_channel(
            db,
            current_user.id,
            liked_profile.user_id,
            spark_context=spark_context,
        )
        match_data = _build_match_data(
            channel_id=channel_id,
            current_user=current_user,
            my_profile=my_profile,
            liked_profile=liked_profile,
            spark_context=spark_context,
        )

    if created:
        context = _spark_context_from_like(like)
        _safe_notify_user(
            db=db,
            user_id=liked_profile.user_id,
            title="New Spark",
            body=f"{my_profile.name} sent you a Spark.",
            type=NotificationType.PROFILE_LIKE.value,
            data={
                "from_profile_id": str(my_profile.id),
                "from_user_id": str(current_user.id),
                "from_profile_photo": get_best_photo(my_profile),
                "from_profile_name": str(my_profile.name),
                "to_profile_id": str(liked_profile.id),
                "to_user_id": str(liked_profile.user_id),
                "to_profile_photo": get_best_photo(liked_profile),
                "to_profile_name": str(liked_profile.name),
                "incoming_spark": context,
            },
        )

    return True, is_matched, match_data, channel_id


def unlike_profile_service(db: Session, current_user, profile_id: str | UUID):
    """Unlike a profile."""
    my_profile = get_profile_by_user_id(db, current_user.id)
    if not my_profile:
        raise ValueError("Profile not found")

    liked_profile = get_profile_by_id(db, profile_id)
    if not liked_profile:
        raise ValueError("Profile not found")

    was_mutual = has_liked(db, liked_profile.id, my_profile.id)

    unliked = unlike_profile(db, my_profile.id, profile_id)

    if unliked:
        logger.info("%s unliked profile %s", current_user.id, liked_profile.user_id)

    if was_mutual:
        logger.info(
            "Checking for mutual like to delete channel between %s and %s",
            current_user.id,
            liked_profile.user_id,
        )
        delete_one_to_one_channel(
            str(current_user.id),
            str(liked_profile.user_id),
        )

    return unliked


def fetch_liked_profiles(
    db,
    my_profile,
    mode: str = "liked",  # "liked" or "liked_me"
    search: str | None = None,
) -> list[dict]:
    """Fetch profiles and include `is_liked` without extra queries per profile."""

    if mode == "liked":
        profiles = get_profiles_liked_by_user(db, my_profile.id, search)
    elif mode == "liked_me":
        profiles = get_users_who_liked_profile(db, my_profile.id, search)
    else:
        raise ValueError("Invalid mode")

    liked_ids = {
        row.liked_id
        for row in db.query(ProfileLike.liked_id)
        .filter(ProfileLike.liker_id == my_profile.id)
        .all()
    }
    incoming_like_by_profile_id = {}
    if mode == "liked_me":
        incoming_likes = (
            db.query(ProfileLike)
            .filter(
                ProfileLike.liked_id == my_profile.id,
                ProfileLike.is_ignored == False,
            )
            .all()
        )
        incoming_like_by_profile_id = {
            str(like.liker_id): like for like in incoming_likes
        }

    user_lat, user_lng = my_profile.latitude, my_profile.longitude
    location_known = (
        my_profile.location_enabled and user_lat is not None and user_lng is not None
    )

    result = []
    for p in profiles:
        if (
            location_known
            and p.location_enabled
            and p.latitude is not None
            and p.longitude is not None
        ):
            distance_km = haversine_km(user_lat, user_lng, p.latitude, p.longitude)
        else:
            distance_km = None

        serialized = ProfileRead.model_validate(p, from_attributes=True).model_dump()
        serialized["distance_km"] = distance_km
        serialized["is_liked"] = p.id in liked_ids
        if mode == "liked_me":
            serialized["incoming_spark"] = _spark_context_from_like(
                incoming_like_by_profile_id.get(str(p.id))
            )

        result.append(serialized)

    return result


def get_ignored_likers_service(db: Session, my_profile_id: str) -> list[Profile]:
    """Fetch profiles of people who liked me, whom I have dismissed/ignored."""
    return get_ignored_likers(db, my_profile_id)


def ignore_profile_like_service(
    db: Session, my_profile_id: str | UUID, other_profile_id: str | UUID
) -> bool:
    """Ignore a profile like."""
    return ignore_profile_like(db, my_profile_id, other_profile_id)


def unignore_profile_like_service(
    db: Session, my_profile_id: str | UUID, other_profile_id: str | UUID
) -> bool:
    """Unignore a profile like."""
    return unignore_profile_like(db, my_profile_id, other_profile_id)


def delete_profile_like_service(
    db: Session,
    current_user,
    liked_profile_id: UUID,
) -> bool:
    """Delete ProfileLike if it exists."""

    my_profile = get_profile_by_user_id(db, current_user.id)
    if not my_profile:
        raise ValueError("Profile not found")

    like = (
        db.query(ProfileLike)
        .filter(
            or_(
                and_(
                    ProfileLike.liker_id == my_profile.id,
                    ProfileLike.liked_id == liked_profile_id,
                ),
                and_(
                    ProfileLike.liker_id == liked_profile_id,
                    ProfileLike.liked_id == my_profile.id,
                ),
            )
        )
        .first()
    )

    if not like:
        return False  # Idempotent: nothing to delete

    db.delete(like)
    db.commit()
    return True
