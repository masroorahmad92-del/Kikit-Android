from uuid import UUID

from sqlalchemy.orm import Session

from app.models.gift_transaction import GiftTransaction


def create_gift_transaction(
    db: Session,
    sender_id: str | UUID,
    receiver_id: str | UUID,
    gift_id: str | UUID,
    coin_cost: int,
    diamond_cost: int = 0,
    live_room_id: str | UUID | None = None,
):
    tx = GiftTransaction(
        sender_id=sender_id,
        receiver_id=receiver_id,
        gift_id=gift_id,
        coin_cost=coin_cost,
        diamond_cost=diamond_cost,
        live_room_id=live_room_id,
    )
    db.add(tx)
    db.flush()
    db.refresh(tx)
    return tx


def get_sent_gifts(db: Session, user_id: str | UUID):
    return (
        db.query(GiftTransaction)
        .filter(GiftTransaction.sender_id == user_id)
        .order_by(GiftTransaction.created_at.desc())
        .all()
    )


def get_received_gifts(db: Session, user_id: str | UUID):
    return (
        db.query(GiftTransaction)
        .filter(GiftTransaction.receiver_id == user_id)
        .order_by(GiftTransaction.created_at.desc())
        .all()
    )
