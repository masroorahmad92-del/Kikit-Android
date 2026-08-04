from uuid import UUID

from sqlalchemy.orm import Session

from app.models.hobby import Hobby
from app.models.interest import Interest
from app.models.user_preferences import UserPreferences


def get_user_preferences(db: Session, user_id: str | UUID) -> UserPreferences | None:
    return db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()


def create_or_update_user_preferences(
    db: Session, user_id: str | UUID, data: dict
) -> UserPreferences:
    prefs = get_user_preferences(db, user_id)
    if prefs is None:
        prefs = UserPreferences(user_id=user_id)
        db.add(prefs)

    if "interests" in data:
        prefs.interests = (
            db.query(Interest).filter(Interest.id.in_(data.pop("interests"))).all()
        )

    if "hobbies" in data:
        prefs.hobbies = db.query(Hobby).filter(Hobby.id.in_(data.pop("hobbies"))).all()

    for k, v in data.items():
        setattr(prefs, k, v)
    db.commit()
    db.refresh(prefs)
    return prefs


def delete_user_preferences(db: Session, user_id: str | UUID) -> bool:
    """
    Deletes the UserPreferences row for a given user.
    Returns True if a record was deleted, False if nothing existed.
    """
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()

    if not prefs:
        return False

    db.delete(prefs)
    db.commit()
    return True
