from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel
from app.models.hobby import Hobby
from app.models.interest import Interest
from app.models.user import User

user_pref_hobbies = Table(
    "user_pref_hobbies",
    BaseModel.metadata,
    Column(
        "user_pref_id",
        ForeignKey("user_preferences.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("hobby_id", ForeignKey("hobbies.id", ondelete="CASCADE"), primary_key=True),
)

user_pref_interests = Table(
    "user_pref_interests",
    BaseModel.metadata,
    Column(
        "user_pref_id",
        ForeignKey("user_preferences.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "interest_id", ForeignKey("interests.id", ondelete="CASCADE"), primary_key=True
    ),
)


class UserPreferences(BaseModel):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    user: Mapped[User] = relationship(
        "User", back_populates="preferences", uselist=False
    )

    looking_for: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=True)

    min_age: Mapped[int] = mapped_column(Integer, nullable=True)
    max_age: Mapped[int] = mapped_column(Integer, nullable=True)
    ethnicity: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=True)
    country: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=True)

    interests: Mapped[list[Interest]] = relationship(
        "Interest", secondary=user_pref_interests, backref="preferred_by_users"
    )
    hobbies: Mapped[list[Hobby]] = relationship(
        "Hobby", secondary=user_pref_hobbies, backref="preferred_by_users"
    )
