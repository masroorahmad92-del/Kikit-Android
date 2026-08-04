from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.enums import LiveRoomStatus


class LiveRoomCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[UUID] = None
    scheduled_for: Optional[datetime] = None
    start_now: bool = False


class LiveRoomSummary(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: LiveRoomStatus
    category_id: Optional[UUID]
    category_name: Optional[str]
    host_user_id: UUID
    host_profile_id: UUID
    host_name: str
    host_photo: Optional[str]
    host_verified: bool
    stream_call_id: str
    stream_chat_channel_id: str
    viewer_count: int
    gift_count: int
    scheduled_for: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    is_host: bool = False
    is_member: bool = False
