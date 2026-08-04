from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.interest import InterestCategoryRead
from app.services.interest import list_all_interests

router = APIRouter(prefix="/interests", tags=["Interests"])


@router.get(
    "",
    response_model=list[InterestCategoryRead],
    status_code=status.HTTP_200_OK,
)
async def get_interests(db: Session = Depends(get_db)) -> list[InterestCategoryRead]:
    """
    Public endpoint — Returns all interest categories with their interests.
    """
    categories = list_all_interests(db)
    return categories
