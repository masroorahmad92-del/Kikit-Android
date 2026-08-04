from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.enums import NotificationType


class NotificationSchema(BaseModel):
    id: UUID
    title: str
    body: str
    notification_type: NotificationType
    data: Optional[dict[str, Any]]
    is_read: bool

    model_config = ConfigDict(from_attributes=True)


class NotificationListData(BaseModel):
    notifications: List[NotificationSchema]

    model_config = ConfigDict(from_attributes=True)
