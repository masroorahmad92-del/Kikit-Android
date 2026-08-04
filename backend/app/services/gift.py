from uuid import UUID

from fastapi import HTTPException
from fastapi_pagination import Params
from sqlalchemy.orm import Session

from app.core.enums import NotificationType
from app.core.logger import logger
from app.models.gift import Gift
from app.models.gift_transaction import GiftTransaction
from app.repositories.announcement import create_gift_announcement
from app.repositories.coin_transaction import (
    log_coin_transaction,
    log_diamond_transaction,
)
from app.repositories.gift import (
    get_gift_by_id,
    get_gifts,
    get_received_gifts,
    get_sent_gifts,
)
from app.repositories.gift_transaction import create_gift_transaction
from app.repositories.user import get_user_by_id
from app.repositories.user_block import is_user_blocked_between
from app.services.announcement import invalidate_announcements_cache
from app.services.notification import notify_user
from app.utils.photos import get_best_photo


def send_gift(
    db: Session,
    sender_id: UUID,
    receiver_id: UUID,
    gift_id: UUID,
    live_room_id: UUID | None = None,
):
    if sender_id == receiver_id:
        raise HTTPException(400, "Cannot send a gift to yourself")

    sender = get_user_by_id(db, sender_id)
    receiver = get_user_by_id(db, receiver_id)
    gift = get_gift_by_id(db, gift_id)

    if sender is None:
        raise HTTPException(404, "Sender not found")

    if receiver is None:
        raise HTTPException(404, "Receiver not found")

    if is_user_blocked_between(db, sender_id, receiver_id):
        raise HTTPException(403, "You cannot send gifts to this user")

    if gift is None:
        raise HTTPException(404, "Gift not found")

    live_room = None
    if live_room_id is not None:
        from app.models.live_room import LiveRoom

        live_room = db.query(LiveRoom).filter(LiveRoom.id == live_room_id).first()
        if live_room is None:
            raise HTTPException(404, "Live room not found")
        if str(live_room.host_user_id) != str(receiver_id):
            raise HTTPException(400, "Live room gifts can only be sent to the host")

    if sender.coin_balance < gift.coin_cost:
        raise HTTPException(400, "Not enough coins")

    try:
        # deduct user coins
        sender.coin_balance -= gift.coin_cost
        logger.debug(f"Deducted {gift.coin_cost} coins from sender")

        # log coin spend
        if gift.coin_cost > 0:
            log_coin_transaction(
                db=db,
                user_id=sender_id,
                amount=-gift.coin_cost,
                reason="gift_send",
            )
            logger.debug("Logged coin transaction")

        # add diamonds to receiver
        if gift.diamond_cost > 0:
            receiver.diamond_balance += gift.diamond_cost
            log_diamond_transaction(
                db=db,
                user_id=receiver_id,
                amount=gift.diamond_cost,
                reason="gift_receive",
            )
            logger.debug("Added diamonds to receiver")

        # log the gift transaction
        tx = create_gift_transaction(
            db=db,
            sender_id=sender_id,
            receiver_id=receiver_id,
            gift_id=gift_id,
            coin_cost=gift.coin_cost,
            diamond_cost=gift.diamond_cost,
            live_room_id=live_room_id,
        )
        logger.debug(f"Created gift transaction: {tx.id}")

        if live_room is not None:
            live_room.gift_count += 1

        sender_name = getattr(sender.profile, "name", "Someone")
        receiver_name = getattr(receiver.profile, "name", "Someone")
        logger.debug(f"Retrieved names: sender={sender_name}, receiver={receiver_name}")

        create_gift_announcement(
            db=db,
            sender_id=sender_id,
            receiver_id=receiver_id,
            gift=gift,
            message=f"{sender_name} sent a {gift.name} to {receiver_name}!",
        )
        logger.debug("Created gift announcement")

        # Send notification to receiver
        sender_photo = get_best_photo(sender.profile) if sender.profile else None
        logger.debug("Retrieved sender photo")
        notify_user(
            db=db,
            user_id=receiver_id,
            title="🎁 New Gift!",
            body=f"{sender_name} sent you a {gift.name}!",
            type=NotificationType.GIFT_RECEIVED.value,
            data={
                "sender_id": str(sender_id),
                "sender_name": sender_name,
                "sender_photo": sender_photo,
                "gift_id": str(gift.id),
                "gift_name": gift.name,
                "gift_icon": gift.icon_url if hasattr(gift, "icon_url") else None,
                "transaction_id": str(tx.id),
                "live_room_id": str(live_room_id) if live_room_id else None,
            },
        )
        logger.debug("Sent notification to receiver")

        db.commit()
        logger.debug("Committed transaction")
        db.refresh(sender)
        db.refresh(receiver)
        logger.debug("Refreshed user objects")
    except Exception as e:
        logger.error(f"Error in send_gift: {type(e).__name__}: {str(e)}", exc_info=True)
        db.rollback()
        raise

    invalidate_announcements_cache()
    return tx


def list_gifts_service(db: Session, params: Params):
    """Fetch all active gifts."""
    return get_gifts(db, params)


def fetch_gift_by_id(db: Session, gift_id: str) -> Gift | None:
    """Fetch a gift by its ID."""
    return get_gift_by_id(db, gift_id)


def fetch_received_gifts(
    db: Session, user_id: UUID, params: Params
) -> list[GiftTransaction]:
    """Fetch gifts received by a user."""
    return get_received_gifts(db, user_id, params)


def fetch_sent_gifts(
    db: Session, user_id: UUID, params: Params
) -> list[GiftTransaction]:
    """Fetch gifts sent by a user."""
    return get_sent_gifts(db, user_id, params)
