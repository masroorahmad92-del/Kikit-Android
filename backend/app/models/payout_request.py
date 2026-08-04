from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import PayoutStatus
from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class PayoutRequest(BaseModel):
    __tablename__ = "payout_requests"

    user_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    diamonds_redeemed: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[PayoutStatus] = mapped_column(
        Enum(PayoutStatus, name="payout_status_enum"),
        nullable=False,
        default=PayoutStatus.processing,
        server_default=PayoutStatus.processing.value,
    )
    trolley_batch_id: Mapped[str | None] = mapped_column(String, nullable=True)
    trolley_payment_id: Mapped[str | None] = mapped_column(String, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User")
