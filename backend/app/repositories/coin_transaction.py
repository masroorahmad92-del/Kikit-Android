from uuid import UUID

from sqlalchemy.orm import Session

from app.models.coin_transaction import CoinTransaction
from app.models.diamond_transaction import DiamondTransaction


def log_coin_transaction(db: Session, user_id: str | UUID, amount: int, reason: str):
    tx = CoinTransaction(user_id=user_id, amount=amount, reason=reason)
    db.add(tx)
    db.flush()
    db.refresh(tx)
    return tx


def log_diamond_transaction(db: Session, user_id: str | UUID, amount: int, reason: str):
    tx = DiamondTransaction(user_id=user_id, amount=amount, reason=reason)
    db.add(tx)
    db.flush()
    db.refresh(tx)
    return tx


def get_user_coin_transactions(db: Session, user_id: str | UUID, limit: int = 50):
    return (
        db.query(CoinTransaction)
        .filter(CoinTransaction.user_id == user_id)
        .order_by(CoinTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
