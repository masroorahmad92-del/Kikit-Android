import uuid
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import NotificationType
from app.database.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(String)

    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )

    data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
