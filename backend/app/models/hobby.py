from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.hobby_category import HobbyCategory
    from app.models.profile import Profile


class Hobby(BaseModel):
    __tablename__ = "hobbies"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("hobby_categories.id"), nullable=False
    )

    category: Mapped["HobbyCategory"] = relationship(
        "HobbyCategory", back_populates="hobbies"
    )
    users: Mapped[list["Profile"]] = relationship(
        "Profile", secondary="user_hobbies", back_populates="hobbies"
    )
