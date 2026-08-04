# app/repositories/phone_verification.py
from sqlalchemy.orm import Session

from app.models.profile import Profile


def get_profile_by_phone(db: Session, phone_number: str) -> Profile | None:
    """Check if a profile exists for the given phone number."""
    return db.query(Profile).filter(Profile.phone_number == phone_number).first()


def mark_phone_verified(db: Session, profile: Profile):
    profile.is_phone_number_verified = True
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
