from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.profile import Profile
from app.models.profile_likes import ProfileLike
from app.models.user import User
from app.models.user_block import UserBlock


def blocked_user_ids_select(user_id: str | UUID):
    return select(UserBlock.blocked_user_id).where(
        UserBlock.blocker_id == user_id
    ).union(select(UserBlock.blocker_id).where(UserBlock.blocked_user_id == user_id))


def get_user_block(
    db: Session, blocker_id: str | UUID, blocked_user_id: str | UUID
) -> UserBlock | None:
    return (
        db.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_user_id == blocked_user_id,
        )
        .first()
    )


def is_user_blocked_between(
    db: Session, user_a_id: str | UUID, user_b_id: str | UUID
) -> bool:
    return (
        db.query(UserBlock)
        .filter(
            or_(
                and_(
                    UserBlock.blocker_id == user_a_id,
                    UserBlock.blocked_user_id == user_b_id,
                ),
                and_(
                    UserBlock.blocker_id == user_b_id,
                    UserBlock.blocked_user_id == user_a_id,
                ),
            )
        )
        .first()
        is not None
    )


def list_user_blocks(db: Session, blocker_id: str | UUID) -> list[UserBlock]:
    return (
        db.query(UserBlock)
        .options(
            joinedload(UserBlock.blocked_user)
            .joinedload(User.profile)
            .selectinload(Profile.photos),
            joinedload(UserBlock.blocked_user)
            .joinedload(User.profile)
            .selectinload(Profile.hobbies),
            joinedload(UserBlock.blocked_user)
            .joinedload(User.profile)
            .selectinload(Profile.interests),
        )
        .filter(UserBlock.blocker_id == blocker_id)
        .order_by(UserBlock.created_at.desc())
        .all()
    )


def delete_likes_between_users(
    db: Session, user_a_id: str | UUID, user_b_id: str | UUID
) -> int:
    profile_a = db.query(Profile).filter(Profile.user_id == user_a_id).first()
    profile_b = db.query(Profile).filter(Profile.user_id == user_b_id).first()

    if not profile_a or not profile_b:
        return 0

    return (
        db.query(ProfileLike)
        .filter(
            or_(
                and_(
                    ProfileLike.liker_id == profile_a.id,
                    ProfileLike.liked_id == profile_b.id,
                ),
                and_(
                    ProfileLike.liker_id == profile_b.id,
                    ProfileLike.liked_id == profile_a.id,
                ),
            )
        )
        .delete(synchronize_session=False)
    )
