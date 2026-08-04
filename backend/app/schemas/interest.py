from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class InterestBase(BaseModel):
    id: UUID
    name: str
    category_id: Optional[UUID] = None


class InterestRead(InterestBase):
    model_config = {"from_attributes": True}


class InterestCategoryRead(BaseModel):
    id: UUID
    name: str
    interests: List[InterestBase] = []

    model_config = {"from_attributes": True}
