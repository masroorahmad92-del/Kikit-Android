from sqlalchemy.orm import Session, selectinload

from app.models import HobbyCategory


def get_all_hobbies(db: Session):
    """
    Fetch all hobby categories with their hobbies.
    """
    return db.query(HobbyCategory).options(selectinload(HobbyCategory.hobbies)).all()
