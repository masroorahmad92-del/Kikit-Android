from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.profile import Profile
    from app.models.user_preferences import UserPreferences


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=True)
    coin_balance: Mapped[int] = mapped_column(Integer, default=0)
    diamond_balance: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    profile: Mapped["Profile"] = relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    devices: Mapped[list["Device"]] = relationship(
        "Device", back_populates="user", cascade="all, delete-orphan"
    )

    preferences: Mapped["UserPreferences"] = relationship(
        "UserPreferences",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # OAuth provider fields
    google_id: Mapped[str] = mapped_column(
        String, unique=True, nullable=True, server_default=None, default=None
    )
    apple_id: Mapped[str] = mapped_column(
        String, unique=True, nullable=True, server_default=None, default=None
    )

    # May need to track email verification status for OAuth users
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    is_admin: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    # Trolley payout fields
    trolley_recipient_id: Mapped[str | None] = mapped_column(
        String, nullable=True, default=None
    )
    # Cached from Trolley; updated via recipients.updated webhook
    trolley_recipient_status: Mapped[str | None] = mapped_column(
        String, nullable=True, default=None
    )

    def __repr__(self):
        return f"User: {self.email} | Active: {getattr(self, 'is_active', 'N/A')}"
