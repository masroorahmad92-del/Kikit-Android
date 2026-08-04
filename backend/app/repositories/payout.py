from decimal import Decimal
from uuid import UUID

from fastapi_pagination import Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.orm import Session

from app.core.enums import PayoutStatus
from app.models.payout_request import PayoutRequest
from app.models.user import User


def create_payout_request(
    db: Session,
    user_id: UUID,
    diamonds_redeemed: int,
    amount_usd: Decimal,
    trolley_batch_id: str | None = None,
    trolley_payment_id: str | None = None,
    status: PayoutStatus = PayoutStatus.processing,
) -> PayoutRequest:
    payout = PayoutRequest(
        user_id=user_id,
        diamonds_redeemed=diamonds_redeemed,
        amount_usd=amount_usd,
        status=status,
        trolley_batch_id=trolley_batch_id,
        trolley_payment_id=trolley_payment_id,
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)
    return payout


def set_payout_trolley_ids(
    db: Session,
    payout: PayoutRequest,
    batch_id: str,
    payment_id: str,
) -> PayoutRequest:
    payout.trolley_batch_id = batch_id
    payout.trolley_payment_id = payment_id
    payout.status = PayoutStatus.processing
    db.flush()
    db.refresh(payout)
    return payout


def get_processing_payout_for_user(db: Session, user_id: UUID) -> PayoutRequest | None:
    return (
        db.query(PayoutRequest)
        .filter(
            PayoutRequest.user_id == user_id,
            PayoutRequest.status.in_([PayoutStatus.scheduled, PayoutStatus.processing]),
        )
        .first()
    )


def get_payout_by_trolley_payment_id(
    db: Session, trolley_payment_id: str
) -> PayoutRequest | None:
    return (
        db.query(PayoutRequest)
        .filter(PayoutRequest.trolley_payment_id == trolley_payment_id)
        .first()
    )


def update_payout_status(
    db: Session,
    payout: PayoutRequest,
    status: PayoutStatus,
    failure_reason: str | None = None,
) -> PayoutRequest:
    payout.status = status
    if failure_reason is not None:
        payout.failure_reason = failure_reason
    db.flush()
    db.refresh(payout)
    return payout


def get_user_payouts(db: Session, user_id: UUID, params: Params):
    return paginate(
        db,
        db.query(PayoutRequest)
        .filter(PayoutRequest.user_id == user_id)
        .order_by(PayoutRequest.created_at.desc()),
        params,
    )


def set_trolley_recipient_id(db: Session, user: User, recipient_id: str) -> User:
    user.trolley_recipient_id = recipient_id
    db.commit()
    db.refresh(user)
    return user
