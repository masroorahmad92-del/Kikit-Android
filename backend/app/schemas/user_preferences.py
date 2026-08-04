from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.core.enums import LookingForEnum
from app.schemas.hobby import HobbyRead
from app.schemas.interest import InterestRead


class UserPreferencesBase(BaseModel):
    looking_for: Optional[List[LookingForEnum]] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    ethnicity: Optional[List[str]] = None
    country: Optional[List[str]] = None


class UserPreferencesRead(UserPreferencesBase):
    id: UUID
    user_id: UUID

    interests: Optional[List[InterestRead]] = None
    hobbies: Optional[List[HobbyRead]] = None

    model_config = {"from_attributes": True}


class UserPreferencesUpdate(UserPreferencesBase):
    interests: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
