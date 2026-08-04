from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.profile import Profile


class ProfileSkip(BaseModel):
    __tablename__ = "profile_skips"

    skipper_id: Mapped[str] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    skipped_id: Mapped[str] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    skipper: Mapped["Profile"] = relationship(
        "Profile",
        foreign_keys=[skipper_id],
    )

    skipped: Mapped["Profile"] = relationship(
        "Profile",
        foreign_keys=[skipped_id],
    )
