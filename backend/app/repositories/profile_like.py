from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.profile import Profile
from app.models.profile_likes import ProfileLike
from app.repositories.user_block import blocked_user_ids_select


def _profile_options():
    return [
        selectinload(Profile.hobbies),
        selectinload(Profile.interests),
        selectinload(Profile.photos),
        joinedload(Profile.user),
    ]


def toggle_profile_like(
    db: Session, liker_profile_id: str | UUID, liked_profile_id: str | UUID
) -> bool:
    if liker_profile_id == liked_profile_id:
        raise ValueError("You cannot like your own profile")

    existing = (
        db.query(ProfileLike)
        .filter(
            ProfileLike.liker_id == liker_profile_id,
            ProfileLike.liked_id == liked_profile_id,
        )
        .first()
    )

    # If exists → Unlike
    if existing:
        db.delete(existing)
        db.commit()
        return False  # meaning: unliked

    # If not exists → Like
    like = ProfileLike(liker_id=liker_profile_id, liked_id=liked_profile_id)
    db.add(like)

    try:
        db.commit()
        return True  # meaning: liked
    except IntegrityError:
        # Handle race condition where duplicate was inserted by another request
        db.rollback()
        # Delete the conflicting record and keep the newer one, or just return False
        existing = (
            db.query(ProfileLike)
            .filter(
                ProfileLike.liker_id == liker_profile_id,
                ProfileLike.liked_id == liked_profile_id,
            )
            .first()
        )
        if existing:
            # The like was already created by another request, so return False (already liked)
            return False
        # If still not found, re-raise the error
        raise


def get_profile_like(
    db: Session, liker_profile_id: str | UUID, liked_profile_id: str | UUID
) -> ProfileLike | None:
    return (
        db.query(ProfileLike)
        .filter(
            ProfileLike.liker_id == liker_profile_id,
            ProfileLike.liked_id == liked_profile_id,
        )
        .first()
    )


def create_or_update_spark_like(
    db: Session,
    liker_profile_id: str | UUID,
    liked_profile_id: str | UUID,
    spark_data: dict,
) -> tuple[ProfileLike, bool]:
    if liker_profile_id == liked_profile_id:
        raise ValueError("You cannot spark your own profile")

    existing = get_profile_like(db, liker_profile_id, liked_profile_id)
    created = existing is None

    like = existing or ProfileLike(
        liker_id=liker_profile_id,
        liked_id=liked_profile_id,
    )

    like.spark_interest_id = spark_data.get("spark_interest_id")
    like.spark_category_id = spark_data.get("spark_category_id")
    like.spark_question = spark_data.get("spark_question")
    like.spark_answer = spark_data.get("spark_answer")
    like.spark_created_from = spark_data.get("spark_created_from") or "discover"
    like.is_ignored = False

    if created:
        db.add(like)

    db.commit()
    db.refresh(like)
    return like, created


def unlike_profile(
    db: Session, liker_profile_id: str | UUID, liked_profile_id: str | UUID
) -> bool:
    """Unlike a profile."""
    existing = (
        db.query(ProfileLike)
        .filter(
            ProfileLike.liker_id == liker_profile_id,
            ProfileLike.liked_id == liked_profile_id,
        )
        .first()
    )

    if not existing:
        return False  # Already unliked

    db.delete(existing)
    db.commit()
    return True  # Successfully unliked


def get_profiles_liked_by_user(
    db: Session, liker_profile_id: str | UUID, search: str | None = None
):
    my_profile = db.query(Profile).filter(Profile.id == liker_profile_id).first()

    query = (
        db.query(Profile)
        .options(*_profile_options())
        .join(ProfileLike, ProfileLike.liked_id == Profile.id)
        .filter(
            ProfileLike.liker_id == liker_profile_id, ProfileLike.is_ignored == False
        )
    )

    if my_profile:
        query = query.filter(
            ~Profile.user_id.in_(blocked_user_ids_select(my_profile.user_id))
        )

    if search:
        query = query.filter(Profile.name.ilike(f"%{search}%"))

    return query.all()


def get_users_who_liked_profile(
    db: Session, liked_profile_id: str | UUID, search: str | None = None
):
    my_profile = db.query(Profile).filter(Profile.id == liked_profile_id).first()

    # Profiles that current user has also liked back (mutual)
    mutual_likes = db.query(ProfileLike.liked_id).filter(
        ProfileLike.liker_id == liked_profile_id,
        ProfileLike.is_ignored == False,
    )

    query = (
        db.query(Profile)
        .options(*_profile_options())
        .join(ProfileLike, ProfileLike.liker_id == Profile.id)
        .filter(
            ProfileLike.liked_id == liked_profile_id,
            ProfileLike.is_ignored == False,
            Profile.id.notin_(mutual_likes),
        )
    )

    if my_profile:
        query = query.filter(
            ~Profile.user_id.in_(blocked_user_ids_select(my_profile.user_id))
        )

    if search:
        query = query.filter(Profile.name.ilike(f"%{search}%"))

    return query.all()


def has_liked(db: Session, liker_id: str | UUID, liked_id: str | UUID) -> bool:
    return (
        db.query(ProfileLike)
        .filter(
            ProfileLike.liker_id == liker_id,
            ProfileLike.liked_id == liked_id,
        )
        .first()
        is not None
    )


def get_ignored_likers(db: Session, my_profile_id: str) -> list[Profile]:
    """
    Fetch profiles of people who liked me, whom I have dismissed/ignored.
    """
    return (
        db.query(Profile)
        .options(*_profile_options())
        .join(ProfileLike, ProfileLike.liker_id == Profile.id)
        .filter(ProfileLike.liked_id == my_profile_id, ProfileLike.is_ignored == True)
        .all()
    )


def ignore_profile_like(
    db: Session, my_profile_id: str | UUID, other_profile_id: str | UUID
) -> bool:
    """Find the like where the other user liked ME"""
    like_record = (
        db.query(ProfileLike)
        .filter(
            ProfileLike.liker_id == other_profile_id,
            ProfileLike.liked_id == my_profile_id,
        )
        .first()
    )

    if not like_record:
        return False

    like_record.is_ignored = True
    db.commit()
    return True


def unignore_profile_like(
    db: Session, my_profile_id: str | UUID, other_profile_id: str | UUID
) -> bool:
    """Find the like where the other user liked ME"""
    like_record = (
        db.query(ProfileLike)
        .filter(
            ProfileLike.liker_id == other_profile_id,
            ProfileLike.liked_id == my_profile_id,
        )
        .first()
    )

    if not like_record:
        return False

    like_record.is_ignored = False
    db.commit()
    return True
