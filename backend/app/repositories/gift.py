from uuid import UUID

from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import asc
from sqlalchemy.orm import Session, joinedload

from app.models.gift import Gift
from app.models.gift_transaction import GiftTransaction
from app.models.profile import Profile
from app.models.user import User
from app.repositories.user import serialize_user
from app.schemas.gifts import GiftSchema


def get_gifts(db: Session, params: Params) -> Page[GiftSchema]:
    """Retrieve all active gifts ordered by coin cost (low → high)."""
    query = db.query(Gift).filter(Gift.is_active == True).order_by(asc(Gift.coin_cost))

    return paginate(
        db,
        query,
        params=params,
        transformer=lambda items: [GiftSchema.model_validate(i) for i in items],
    )


def get_gift_by_id(db: Session, gift_id: str | UUID) -> Gift | None:
    """Retrieve a gift by its ID."""
    return db.query(Gift).filter(Gift.id == gift_id, Gift.is_active == True).first()


def get_received_gifts(db: Session, user_id: UUID, params: Params) -> Page:
    query = (
        db.query(GiftTransaction)
        .options(
            joinedload(GiftTransaction.sender)
            .joinedload(User.profile)
            .selectinload(Profile.photos),
            joinedload(GiftTransaction.gift),
        )
        .filter(GiftTransaction.receiver_id == user_id)
        .order_by(GiftTransaction.created_at.desc())
    )

    return paginate(
        db,
        query,
        params=params,
        transformer=lambda txs: [
            {
                "id": tx.id,
                "gift": {
                    "id": tx.gift.id,
                    "name": tx.gift.name,
                    "icon": tx.gift.icon,
                },
                "coin_cost": tx.coin_cost,
                "diamond_cost": tx.diamond_cost,
                "sender": serialize_user(tx.sender),
                "created_at": tx.created_at,
            }
            for tx in txs
        ],
    )


def get_sent_gifts(db: Session, user_id: UUID, params: Params) -> Page:
    query = (
        db.query(GiftTransaction)
        .options(
            joinedload(GiftTransaction.receiver)
            .joinedload(User.profile)
            .selectinload(Profile.photos),
            joinedload(GiftTransaction.gift),
        )
        .filter(GiftTransaction.sender_id == user_id)
        .order_by(GiftTransaction.created_at.desc())
    )

    return paginate(
        db,
        query,
        params=params,
        transformer=lambda txs: [
            {
                "id": tx.id,
                "gift": {
                    "id": tx.gift.id,
                    "name": tx.gift.name,
                    "icon": tx.gift.icon,
                },
                "coin_cost": tx.coin_cost,
                "diamond_cost": tx.diamond_cost,
                "receiver": serialize_user(tx.receiver),
                "created_at": tx.created_at,
            }
            for tx in txs
        ],
    )
