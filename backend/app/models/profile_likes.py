from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.interest import Interest
    from app.models.interest_category import InterestCategory
    from app.models.profile import Profile


class ProfileLike(BaseModel):
    __tablename__ = "profile_likes"

    liker_id: Mapped[str] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    liked_id: Mapped[str] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    is_ignored: Mapped[bool] = mapped_column(default=False, server_default="false")
    spark_interest_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("interests.id", ondelete="SET NULL"), nullable=True
    )
    spark_category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("interest_categories.id", ondelete="SET NULL"), nullable=True
    )
    spark_question: Mapped[str | None] = mapped_column(String(255), nullable=True)
    spark_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    spark_created_from: Mapped[str] = mapped_column(
        String(50), nullable=False, default="discover", server_default="discover"
    )

    __table_args__ = (
        UniqueConstraint("liker_id", "liked_id", name="unique_profile_like"),
    )

    liker: Mapped["Profile"] = relationship(
        "Profile", foreign_keys=[liker_id], back_populates="likes_given"
    )
    liked: Mapped["Profile"] = relationship(
        "Profile", foreign_keys=[liked_id], back_populates="likes_received"
    )
    spark_interest: Mapped["Interest | None"] = relationship(
        "Interest", foreign_keys=[spark_interest_id]
    )
    spark_category: Mapped["InterestCategory | None"] = relationship(
        "InterestCategory", foreign_keys=[spark_category_id]
    )
