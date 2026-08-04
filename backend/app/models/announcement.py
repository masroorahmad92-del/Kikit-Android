from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel


class Announcement(BaseModel):
    __tablename__ = "announcements"

    sender_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    receiver_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    gift_id: Mapped[int] = mapped_column(ForeignKey("gifts.id"), nullable=False)

    message: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    gift = relationship("Gift")
