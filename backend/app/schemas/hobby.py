from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class HobbyBase(BaseModel):
    id: UUID
    name: str
    category_id: Optional[UUID] = None


class HobbyRead(HobbyBase):
    model_config = {"from_attributes": True}


class HobbyCategoryRead(BaseModel):
    id: UUID
    name: str
    hobbies: List[HobbyBase] = []

    model_config = {"from_attributes": True}
