from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import settings
from app.core.enums import PayoutStatus


class PayoutRecipientResponse(BaseModel):
    has_recipient: bool
    trolley_recipient_id: str | None = None
    widget_token: str | None = None
    widget_url: str | None = None


class RecipientStatusResponse(BaseModel):
    """Live recipient status fetched from Trolley."""

    has_recipient: bool
    trolley_recipient_id: str | None = None
    # Trolley top-level status: "active", "incomplete", "suspended", "archived"
    status: str | None = None
    # True when the recipient has at least one linked payout method (bank / PayPal)
    has_payout_method: bool = False
    # Derived state the frontend can use to show the right message:
    #   "active"              – fully set up, ready to receive payouts
    #   "pending_tax_review"  – tax form submitted, awaiting platform approval
    #   "pending_payout_method" – approved/active compliance but no payout method added
    #   "incomplete"          – needs to complete setup in the widget
    compliance_state: str | None = None


class PayoutRequestCreate(BaseModel):
    diamonds: int = Field(..., description="Number of diamonds to redeem for cash")

    @field_validator("diamonds")
    @classmethod
    def validate_diamonds(cls, v: int) -> int:
        if v < settings.MIN_PAYOUT_DIAMONDS:
            raise ValueError(
                f"Minimum payout is {settings.MIN_PAYOUT_DIAMONDS:,} diamonds"
            )
        if v > settings.MAX_PAYOUT_DIAMONDS:
            raise ValueError(
                f"Maximum payout is {settings.MAX_PAYOUT_DIAMONDS:,} diamonds"
            )
        return v


class PayoutRequestSchema(BaseModel):
    id: UUID
    diamonds_redeemed: int
    amount_usd: Decimal
    status: PayoutStatus
    trolley_batch_id: str | None
    trolley_payment_id: str | None
    failure_reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
