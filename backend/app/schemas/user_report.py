from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.enums import ReportReason


class ReportCreate(BaseModel):
    reported_user_id: UUID
    reason: ReportReason
    description: Optional[str] = Field(None, max_length=1000)
    live_room_id: Optional[UUID] = None


class MessageReportCreate(BaseModel):
    message_id: str = Field(..., min_length=1, max_length=255)
    channel_id: str = Field(..., min_length=1, max_length=255)
    reported_user_id: UUID
    reason: ReportReason
    description: Optional[str] = Field(None, max_length=1000)
    message_text: Optional[str] = Field(None, max_length=4000)
    live_room_id: Optional[UUID] = None
