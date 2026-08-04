from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.interest import Interest


class InterestCategory(BaseModel):
    __tablename__ = "interest_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    interests: Mapped[list["Interest"]] = relationship(
        "Interest", back_populates="category", cascade="all, delete-orphan"
    )
