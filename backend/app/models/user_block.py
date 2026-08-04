import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class UserBlock(BaseModel):
    __tablename__ = "user_blocks"

    blocker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    blocked_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    blocker: Mapped["User"] = relationship("User", foreign_keys=[blocker_id])
    blocked_user: Mapped["User"] = relationship(
        "User", foreign_keys=[blocked_user_id]
    )

    __table_args__ = (
        UniqueConstraint(
            "blocker_id", "blocked_user_id", name="uq_user_blocks_blocker_blocked"
        ),
    )
