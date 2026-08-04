import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel


# GiftTransaction model to record gift sending between users
class GiftTransaction(BaseModel):
    __tablename__ = "gift_transactions"

    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    gift_id: Mapped[int] = mapped_column(ForeignKey("gifts.id"))
    live_room_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("live_rooms.id", ondelete="SET NULL"), nullable=True, index=True
    )

    coin_cost: Mapped[int] = mapped_column(
        Integer, doc="Cost in coins at the time of transaction", default=0
    )

    diamond_cost: Mapped[int] = mapped_column(
        Integer,
        doc="Cost in diamonds at the time of transaction",
        server_default="0",
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    gift = relationship("Gift")
