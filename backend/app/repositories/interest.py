from sqlalchemy.orm import Session, selectinload

from app.models import InterestCategory


def get_all_interests(db: Session):
    """
    Fetch all interest categories with their interests.
    """
    return (
        db.query(InterestCategory)
        .options(selectinload(InterestCategory.interests))
        .all()
    )
