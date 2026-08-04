from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel


class DiamondTransaction(BaseModel):
    __tablename__ = "diamond_transactions"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)  # + or -
    reason: Mapped[str] = mapped_column(String(100))  # "gift_receive", etc.
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User")
