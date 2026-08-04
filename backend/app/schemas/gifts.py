from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GiftSchema(BaseModel):
    id: UUID
    name: str
    icon: Optional[str] = None
    coin_cost: int
    diamond_cost: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class GiftListData(BaseModel):
    gifts: List[GiftSchema]


class SendGiftRequest(BaseModel):
    receiver_id: UUID
    gift_id: UUID
    live_room_id: Optional[UUID] = None


class GiftHistorySchema(BaseModel):
    id: UUID
    gift_name: str
    gift_icon: Optional[str]
    coin_cost: int
    diamond_cost: int
    other_user_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GiftHistoryList(BaseModel):
    transactions: List[GiftHistorySchema]
