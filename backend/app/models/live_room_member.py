import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import LiveRoomMemberRole
from app.database.base import BaseModel


class LiveRoomMember(BaseModel):
    __tablename__ = "live_room_members"
    __table_args__ = (
        UniqueConstraint("room_id", "user_id", name="uq_live_room_member_room_user"),
    )

    room_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("live_rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[LiveRoomMemberRole] = mapped_column(
        Enum(
            LiveRoomMemberRole,
            name="live_room_member_role_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        default=LiveRoomMemberRole.VIEWER,
        server_default=LiveRoomMemberRole.VIEWER.value,
    )
    joined_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    room = relationship("LiveRoom", back_populates="members")
