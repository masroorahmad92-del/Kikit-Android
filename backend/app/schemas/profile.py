from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.core.enums import (
    CurrentStatusEnum,
    EthnicityEnum,
    GenderEnum,
    InterestedInEnum,
    LookingForEnum,
    ProfileReviewStatus,
    SubscriptionType,
)
from app.schemas.hobby import HobbyRead
from app.schemas.interest import InterestRead
from app.schemas.profile_photo import PhotoSchema
from app.schemas.user import UserInfo


class ProfileBase(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gender: Optional[GenderEnum] = None
    country_code: Optional[str] = None
    phone_number: Optional[str] = None
    looking_for: Optional[List[LookingForEnum]] = None
    interested_in: Optional[InterestedInEnum] = None
    height: Optional[str] = None
    current_status: Optional[CurrentStatusEnum] = None
    ethnicity: Optional[EthnicityEnum] = None
    about: Optional[str] = None
    location_enabled: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acknowledged_terms: Optional[bool] = None
    photos: Optional[List[PhotoSchema]] = None
    is_phone_number_verified: Optional[bool] = None
    is_profile_complete: Optional[bool] = None
    is_profile_verified: Optional[bool] = None

    @field_validator("dob", mode="before")
    @classmethod
    def validate_age_18_plus(cls, v):
        if v is None:
            return v

        dob = None
        for fmt in ["%d-%m-%Y", "%m/%d/%Y", "%Y-%m-%d", "%Y-%d-%m"]:
            try:
                dob = datetime.strptime(v, fmt).date()
                break
            except ValueError:
                continue

        if dob is None:
            raise ValueError(f"Invalid date format. Use DD-MM-YYYY format")

        age = (datetime.now().date() - dob).days // 365
        if age < 18:
            raise ValueError("You must be at least 18 years old to create a profile")

        return dob.strftime("%d-%m-%Y")

    @field_validator("looking_for", mode="before")
    @classmethod
    def normalize_looking_for(cls, v):
        if v is None:
            return v
        valid = {e.value for e in LookingForEnum}
        return [item.lower() for item in v if isinstance(item, str) and item.lower() in valid]


class ProfileUpdate(ProfileBase):
    """All fields optional for PATCH requests."""

    interests: Optional[List[UUID]] = None
    hobbies: Optional[List[UUID]] = None


class ProfileRead(ProfileBase):
    id: UUID
    review_status: ProfileReviewStatus
    is_liked: Optional[bool] = (
        False  # Indicates if the profile is liked by the current user
    )
    interests: Optional[List[InterestRead]] = None
    hobbies: Optional[List[HobbyRead]] = None
    distance_km: Optional[float] = None
    user: Optional[UserInfo] = None
    subscription_type: Optional[SubscriptionType] = None
    subscription_start_date: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None
    calls_taken: int = 0
    purchased_calls: int = 0

    model_config = {"from_attributes": True}


class SubscriptionSet(BaseModel):
    subscription_type: SubscriptionType


class PurchasedCallsAdd(BaseModel):
    calls_count: int


class SubscriptionRead(BaseModel):
    subscription_type: Optional[SubscriptionType] = None
    subscription_start_date: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None
    calls_taken: int = 0
    purchased_calls: int = 0

    model_config = {"from_attributes": True}
