from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserAuthData(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserInfo(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    coin_balance: int
    diamond_balance: int

    model_config = {"from_attributes": True}


class UpdateBalanceRequest(BaseModel):
    coins: Optional[int] = Field(
        None, description="Amount to add (positive) or subtract (negative)"
    )
    diamonds: Optional[int] = Field(
        None, description="Amount to add (positive) or subtract (negative)"
    )
