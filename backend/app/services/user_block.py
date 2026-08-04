from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import ReportReason
from app.core.logger import logger
from app.models.user_block import UserBlock
from app.models.user_report import UserReport
from app.repositories.chat import delete_one_to_one_channel
from app.repositories.user import get_user_by_id
from app.repositories.user_block import (
    delete_likes_between_users,
    get_user_block,
    is_user_blocked_between,
    list_user_blocks,
)


BLOCKED_INTERACTION_MESSAGE = "You cannot interact with this user."


def _create_block_moderation_record(
    db: Session, blocker_id: str | UUID, blocked_user_id: str | UUID
) -> None:
    db.add(
        UserReport(
            reporter_id=blocker_id,
            reported_user_id=blocked_user_id,
            reason=ReportReason.HARASSMENT,
            description="User blocked this member. Review for possible abusive behavior.",
            report_type="BLOCK",
        )
    )
    db.flush()


def assert_users_not_blocked(
    db: Session, user_a_id: str | UUID, user_b_id: str | UUID
) -> None:
    if is_user_blocked_between(db, user_a_id, user_b_id):
        raise PermissionError(BLOCKED_INTERACTION_MESSAGE)


def block_user_service(
    db: Session, blocker_id: str | UUID, blocked_user_id: str | UUID
) -> dict:
    if str(blocker_id) == str(blocked_user_id):
        raise ValueError("You cannot block yourself")

    if not get_user_by_id(db, blocked_user_id):
        raise LookupError("User not found")

    block = get_user_block(db, blocker_id, blocked_user_id)
    created = False

    try:
        if not block:
            block = UserBlock(blocker_id=blocker_id, blocked_user_id=blocked_user_id)
            db.add(block)
            db.flush()
            created = True

        delete_likes_between_users(db, blocker_id, blocked_user_id)
        if created:
            _create_block_moderation_record(db, blocker_id, blocked_user_id)
        db.commit()
        db.refresh(block)
    except IntegrityError:
        db.rollback()
        block = get_user_block(db, blocker_id, blocked_user_id)
        if not block:
            raise
        delete_likes_between_users(db, blocker_id, blocked_user_id)
        db.commit()
    except Exception:
        db.rollback()
        raise

    try:
        delete_one_to_one_channel(str(blocker_id), str(blocked_user_id))
    except Exception:
        logger.warning(
            "Failed to schedule Stream channel deletion for users %s and %s",
            blocker_id,
            blocked_user_id,
            exc_info=True,
        )

    return {
        "block_id": block.id if block else None,
        "blocked_user_id": blocked_user_id,
        "is_blocked": True,
        "created": created,
    }


def unblock_user_service(
    db: Session, blocker_id: str | UUID, blocked_user_id: str | UUID
) -> dict:
    block = get_user_block(db, blocker_id, blocked_user_id)
    deleted = False

    if block:
        db.delete(block)
        db.commit()
        deleted = True

    return {
        "blocked_user_id": blocked_user_id,
        "is_blocked": False,
        "deleted": deleted,
    }


def list_blocked_users_service(
    db: Session, blocker_id: str | UUID
) -> list[UserBlock]:
    return list_user_blocks(db, blocker_id)
