import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Enum

from app.core.enums import ReportReason, ReportStatus
from app.database.base import BaseModel


class UserReport(BaseModel):
    __tablename__ = "user_reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    reported_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    reason: Mapped[ReportReason] = mapped_column(Enum(ReportReason), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    report_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="USER", server_default="USER", index=True
    )
    message_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    channel_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    live_room_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("live_rooms.id", ondelete="SET NULL"), nullable=True, index=True
    )
    message_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus), default=ReportStatus.PENDING
    )
