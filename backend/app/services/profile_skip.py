from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.models.profile_skip import ProfileSkip
from app.repositories.profile_skip import create_skip, get_skip


def skip_profile(
    db: Session,
    skipper: Profile,
    skipped_id: str,
) -> ProfileSkip:
    if skipper.id == skipped_id:
        raise ValueError("You cannot skip yourself")

    existing = get_skip(db, skipper.id, skipped_id)
    if existing:
        return existing

    return create_skip(db, skipper.id, skipped_id)
