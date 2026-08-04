import requests as http_requests
from trolley.exceptions.malformedException import MalformedException

from app.core.celery import celery_app
from app.core.logger import logger


@celery_app.task(name="tasks.process_scheduled_payout", bind=True, max_retries=0)
def process_scheduled_payout_task(self, payout_id: str, user_id: str):
    """
    Execute a previously scheduled payout: submit the Trolley batch and update
    the PayoutRequest record with the resulting IDs.

    On Trolley failure the diamonds are refunded and the PayoutRequest is marked
    failed so the user can retry.
    """
    from uuid import UUID

    from app.core import trolley as trolley_client
    from app.core.enums import PayoutStatus
    from app.database.session import SessionLocal
    from app.models.payout_request import PayoutRequest
    from app.repositories.coin_transaction import log_diamond_transaction
    from app.repositories.payout import set_payout_trolley_ids, update_payout_status

    db = SessionLocal()
    try:
        payout = (
            db.query(PayoutRequest).filter(PayoutRequest.id == UUID(payout_id)).first()
        )
        if payout is None:
            logger.error(
                "process_scheduled_payout: PayoutRequest %s not found", payout_id
            )
            return

        if payout.status != PayoutStatus.scheduled:
            logger.warning(
                "process_scheduled_payout: PayoutRequest %s is not in scheduled status (got %s), skipping",
                payout_id,
                payout.status,
            )
            return

        user = payout.user
        if not user.trolley_recipient_id:
            logger.error(
                "process_scheduled_payout: user %s has no trolley_recipient_id", user_id
            )
            return

        memo = f"KiKit diamond payout — {payout.diamonds_redeemed:,} diamonds"

        try:
            batch_id, payment_id = trolley_client.create_and_process_payment(
                recipient_id=user.trolley_recipient_id,
                amount_usd=payout.amount_usd,
                memo=memo,
            )
        except (http_requests.HTTPError, MalformedException) as e:
            logger.error(
                "process_scheduled_payout: Trolley submission failed for payout %s user %s",
                payout_id,
                user_id,
                exc_info=e,
            )
            # Refund diamonds
            user.diamond_balance += payout.diamonds_redeemed
            log_diamond_transaction(
                db=db,
                user_id=user.id,
                amount=payout.diamonds_redeemed,
                reason="payout_redeem_rollback",
            )
            update_payout_status(db, payout, PayoutStatus.failed, failure_reason=str(e))
            db.commit()
            return

        set_payout_trolley_ids(db, payout, batch_id, payment_id)
        db.commit()

        logger.info(
            "Scheduled payout submitted: user=%s payout=%s diamonds=%d usd=%.2f batch=%s payment=%s",
            user_id,
            payout_id,
            payout.diamonds_redeemed,
            payout.amount_usd,
            batch_id,
            payment_id,
        )
    except Exception:
        logger.error(
            "process_scheduled_payout: unexpected error for payout %s",
            payout_id,
            exc_info=True,
        )
        db.rollback()
        raise
    finally:
        db.close()
