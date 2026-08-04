from uuid import UUID

from sqlalchemy.orm import Session

from app.models.profile_skip import ProfileSkip


def get_skip(
    db: Session,
    skipper_id: str | UUID,
    skipped_id: str | UUID,
) -> ProfileSkip | None:
    return (
        db.query(ProfileSkip)
        .filter(
            ProfileSkip.skipper_id == skipper_id,
            ProfileSkip.skipped_id == skipped_id,
        )
        .first()
    )


def create_skip(
    db: Session,
    skipper_id: str | UUID,
    skipped_id: str | UUID,
) -> ProfileSkip:
    skip = ProfileSkip(
        skipper_id=skipper_id,
        skipped_id=skipped_id,
    )
    db.add(skip)
    db.commit()
    db.refresh(skip)
    return skip
