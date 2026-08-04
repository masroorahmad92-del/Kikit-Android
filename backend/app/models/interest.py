from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.interest_category import InterestCategory
    from app.models.profile import Profile


class Interest(BaseModel):
    __tablename__ = "interests"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("interest_categories.id"), nullable=False
    )

    category: Mapped["InterestCategory"] = relationship(
        "InterestCategory", back_populates="interests"
    )
    users: Mapped[list["Profile"]] = relationship(
        "Profile", secondary="user_interests", back_populates="interests"
    )
