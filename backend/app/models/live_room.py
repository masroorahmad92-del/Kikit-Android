import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import LiveRoomStatus
from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.interest_category import InterestCategory
    from app.models.live_room_member import LiveRoomMember
    from app.models.profile import Profile
    from app.models.user import User


class LiveRoom(BaseModel):
    __tablename__ = "live_rooms"

    host_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    host_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("interest_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[LiveRoomStatus] = mapped_column(
        Enum(
            LiveRoomStatus,
            name="live_room_status_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        default=LiveRoomStatus.SCHEDULED,
        server_default=LiveRoomStatus.SCHEDULED.value,
        index=True,
    )
    stream_call_id: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    stream_chat_channel_id: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False
    )
    viewer_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    gift_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    host_user: Mapped["User"] = relationship("User")
    host_profile: Mapped["Profile"] = relationship("Profile")
    category: Mapped["InterestCategory | None"] = relationship("InterestCategory")
    members: Mapped[list["LiveRoomMember"]] = relationship(
        "LiveRoomMember", back_populates="room", cascade="all, delete-orphan"
    )
