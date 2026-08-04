from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.hobby import HobbyCategoryRead
from app.services.hobby import list_all_hobbies

router = APIRouter(prefix="/hobbies", tags=["Hobbies"])


@router.get(
    "",
    response_model=list[HobbyCategoryRead],
    status_code=status.HTTP_200_OK,
)
async def get_hobbies(db: Session = Depends(get_db)) -> list[HobbyCategoryRead]:
    """
    Public endpoint — Returns all hobby categories with their hobbies.
    """
    categories = list_all_hobbies(db)
    return categories
