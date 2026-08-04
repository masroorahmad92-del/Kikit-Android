from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class Device(BaseModel):
    __tablename__ = "devices"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    fcm_token: Mapped[str] = mapped_column(String, nullable=False)

    user: Mapped["User"] = relationship(back_populates="devices")
