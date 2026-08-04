from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AnnouncementResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    gift_id: UUID
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
