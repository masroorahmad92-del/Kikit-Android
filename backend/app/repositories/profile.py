from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from psycopg2.errors import UniqueViolation
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.enums import ProfileReviewStatus, SubscriptionType
from app.core.logger import logger
from app.core.stream import stream_client
from app.models import Hobby, Interest, Profile, ProfilePhoto

UNIQUE_CONSTRAINT_MESSAGES = {
    "profiles_phone_number_key": "This phone number is already associated with another profile.",
    "profile_photos_public_id_key": "A photo with this public ID already exists.",
}


def upsert_streamchat_user(
    user_id: str, name: str | None = None, image: str | None = None
):
    """
    Create or update a Stream Chat user (UPSERT).
    Safely updates fields while preserving existing data.
    """
    try:
        payload = {"id": user_id}

        if name:
            payload["name"] = name

        if image:
            payload["image"] = image

        # Upsert user (Create or Update)
        res = stream_client.upsert_user(payload)
        return res.get("users", {}).get(user_id)

    except Exception as e:
        logger.error("Streamchat profile upsert failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"StreamChat user error: {e}",
        )


def _profile_query(db: Session):
    """Base query with eager-loaded relationships needed for ProfileRead serialization."""
    return db.query(Profile).options(
        selectinload(Profile.hobbies),
        selectinload(Profile.interests),
        selectinload(Profile.photos),
        joinedload(Profile.user),
    )


def get_profile_by_user_id(db: Session, user_id: str | UUID) -> Profile | None:
    """Fetch a profile by user ID."""
    return _profile_query(db).filter(Profile.user_id == user_id).first()


def get_profile_by_id(db: Session, profile_id: str | UUID) -> Profile | None:
    """Fetch a profile by profile ID."""
    return _profile_query(db).filter(Profile.id == profile_id).first()


def get_many_to_many_objects(db: Session, model, ids: list):
    """Fetch related objects for many-to-many fields, safely converting UUID strings."""
    if not ids:
        return []
    # Convert string UUIDs to actual UUID objects
    uuids = [UUID(i) if isinstance(i, str) else i for i in ids]
    return db.query(model).filter(model.id.in_(uuids)).all()


def update_photos(db: Session, profile: Profile, photos_data: list):
    # Clear existing photos
    profile.photos.clear()
    db.flush()

    for item in photos_data:
        if not isinstance(item, dict):
            continue

        profile.photos.append(ProfilePhoto(**item))


def set_location(profile: Profile):
    """
    Update the PostGIS location column from latitude and longitude.
    Only set if both values exist.
    """
    if profile.latitude is not None and profile.longitude is not None:
        profile.location = func.ST_MakePoint(profile.longitude, profile.latitude)
    else:
        profile.location = None


def update_existing_profile(db: Session, profile: Profile, data: dict) -> None:
    """Update an existing profile with the provided data."""
    relationship_handlers = {
        "interests": lambda val: get_many_to_many_objects(db, Interest, val),
        "hobbies": lambda val: get_many_to_many_objects(db, Hobby, val),
        "photos": lambda val: update_photos(db, profile, val),
    }

    for key, value in data.items():
        if handler := relationship_handlers.get(key):
            result = handler(value)
            if key != "photos":
                setattr(profile, key, result)
        else:
            setattr(profile, key, value)

    # Update PostGIS location
    set_location(profile)


def create_new_profile(db: Session, user_id: str | UUID, data: dict) -> Profile:
    """Create a new profile with the provided data."""
    relationships = {
        "interests": data.pop("interests", None),
        "hobbies": data.pop("hobbies", None),
        "photos": data.pop("photos", None),
    }

    profile = Profile(user_id=user_id, **data)
    db.add(profile)

    # Set many-to-many relationships
    if relationships["interests"]:
        profile.interests = get_many_to_many_objects(
            db, Interest, relationships["interests"]
        )

    if relationships["hobbies"]:
        profile.hobbies = get_many_to_many_objects(db, Hobby, relationships["hobbies"])

    if relationships["photos"]:
        update_photos(db, profile, relationships["photos"])

    # Set PostGIS location
    set_location(profile)

    return profile


def sync_streamchat_user(profile: Profile) -> None:
    """Synchronize profile data with Stream Chat via Celery task."""
    from app.tasks.stream_chat import upsert_stream_chat_user

    user_id = str(profile.user_id)
    name = profile.name
    image = profile.photos[0].url if profile.photos else None

    upsert_stream_chat_user.delay(user_id, name, image)


def create_or_update_profile(db: Session, user_id: str | UUID, data: dict) -> Profile:
    """
    Create or update a profile progressively across steps.
    Supports partial updates (PATCH).
    """
    profile = get_profile_by_user_id(db, user_id)

    try:
        if profile:
            update_existing_profile(db, profile, data)
        else:
            profile = create_new_profile(db, user_id, data)

        db.commit()
        db.refresh(profile)
        sync_streamchat_user(profile)  # After commit — data is consistent
        return profile

    except IntegrityError as e:
        db.rollback()

        if isinstance(e.orig, UniqueViolation):
            error_message = str(e.orig)

            for constraint, message in UNIQUE_CONSTRAINT_MESSAGES.items():
                if constraint in error_message:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=message,
                    )

        logger.error("Integrity error during profile upsert", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid data provided.",
        )

    except SQLAlchemyError:
        db.rollback()
        logger.error("Database error during profile upsert", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong while saving your profile. Please try again.",
        )


def update_review_status(
    db: Session, user_id: str, status_: ProfileReviewStatus
) -> Profile:
    """Update the review status (pending, approved, rejected)."""
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.review_status = status_
    db.commit()
    db.refresh(profile)
    return profile


def calculate_age(dob):
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _subscription_expires_at(
    subscription_type: SubscriptionType, start: datetime
) -> datetime:
    if subscription_type == SubscriptionType.MONTHLY:
        return start + timedelta(days=30)
    return start + timedelta(days=365)


def set_profile_subscription(
    db: Session, profile: Profile, subscription_type: SubscriptionType
) -> Profile:
    """Set or update the subscription on a profile. Resets calls_taken."""
    now = datetime.now(timezone.utc)
    profile.subscription_type = subscription_type
    profile.subscription_start_date = now
    profile.subscription_expires_at = _subscription_expires_at(subscription_type, now)
    profile.calls_taken = 0
    db.commit()
    db.refresh(profile)
    return profile


def remove_profile_subscription(db: Session, profile: Profile) -> Profile:
    """Clear the subscription from a profile."""
    profile.subscription_type = None
    profile.subscription_start_date = None
    profile.subscription_expires_at = None
    profile.calls_taken = 0
    db.commit()
    db.refresh(profile)
    return profile


def increment_calls_taken(db: Session, profile: Profile) -> Profile:
    """Use one call. Consumes purchased_calls first; falls back to subscription calls_taken."""
    if profile.purchased_calls > 0:
        profile.purchased_calls -= 1
    else:
        profile.calls_taken += 1
    db.commit()
    db.refresh(profile)
    return profile


def add_purchased_calls(db: Session, profile: Profile, calls_count: int) -> Profile:
    """Add one-time purchased calls to a profile."""
    profile.purchased_calls += calls_count
    db.commit()
    db.refresh(profile)
    return profile


def renew_expired_subscriptions(db: Session) -> int:
    """
    Renew subscriptions that have expired.
    Only profiles with a non-None subscription_type are processed.
    Returns the number of profiles renewed.
    """
    now = datetime.now(timezone.utc)
    expired = (
        db.query(Profile)
        .filter(
            Profile.subscription_type.isnot(None),
            Profile.subscription_expires_at <= now,
        )
        .all()
    )

    count = 0
    for profile in expired:
        profile.subscription_start_date = now
        if profile.subscription_type is None:
            continue
        profile.subscription_expires_at = _subscription_expires_at(
            profile.subscription_type, now
        )
        profile.calls_taken = 0
        count += 1

    if count:
        db.commit()

    return count


def delete_streamchat_user(user_id: str):
    """
    Delete a Stream Chat user.
    This should be called when a user deletes their account.
    """
    try:
        # Hard delete Stream Chat user
        stream_client.delete_user(user_id, hard_delete=True)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"StreamChat user deletion error: {e}",
        )
