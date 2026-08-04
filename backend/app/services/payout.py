from decimal import ROUND_DOWN, Decimal
from uuid import UUID

import requests as http_requests
from fastapi import HTTPException
from fastapi_pagination import Params
from sqlalchemy.orm import Session
from trolley.exceptions.malformedException import MalformedException

from app.core import settings
from app.core import trolley as trolley_client
from app.core.enums import PayoutStatus
from app.core.logger import logger
from app.models.user import User
from app.repositories.coin_transaction import log_diamond_transaction
from app.repositories.payout import (
    create_payout_request,
    get_payout_by_trolley_payment_id,
    get_processing_payout_for_user,
    get_user_payouts,
    set_trolley_recipient_id,
    update_payout_status,
)
from app.repositories.user import get_user_by_id, get_user_by_trolley_recipient_id
from app.services.notification import notify_user
from app.tasks.payout import process_scheduled_payout_task


def get_or_create_recipient_service(db: Session, user: User) -> dict:
    """
    Ensure the user has a Trolley recipient record and return a fresh widget token.
    Creates the recipient on first call; subsequent calls only refresh the token.
    """
    if not user.trolley_recipient_id:
        profile = user.profile
        if profile and profile.name:
            parts = profile.name.strip().split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else parts[0]
        else:
            first_name = user.email.split("@")[0]
            last_name = "User"

        try:
            recipient_id = trolley_client.create_recipient(
                email=user.email,
                first_name=first_name,
                last_name=last_name,
            )
        except Exception as e:
            logger.error("Trolley create_recipient failed", exc_info=e)
            raise HTTPException(502, "Failed to register with payout provider")

        set_trolley_recipient_id(db, user, recipient_id)

    if not user.trolley_recipient_id:
        raise HTTPException(
            500, "Recipient registration succeeded but ID was not saved"
        )
    widget_url = trolley_client.get_widget_url(user.trolley_recipient_id, user.email)

    return {
        "has_recipient": True,
        "trolley_recipient_id": user.trolley_recipient_id,
        "widget_url": widget_url,
    }


def _derive_compliance_state(
    trolley_status: str, compliance: dict | None, has_payout_method: bool
) -> str:
    """
    Translate raw Trolley status + compliance data into a single frontend-friendly state.

    Trolley compliance object shape (when present):
      { "status": "pending"|"verified"|"failed"|"na"|"waiting",
        "taxStatus": "na"|"submitted"|"pending"|"approved"|"failed" }
    """
    if trolley_status == "active":
        return "active"

    tax_status = (compliance or {}).get("taxStatus", "na")
    if tax_status in ("submitted", "pending"):
        # Tax form is in Trolley — waiting for platform admin to approve in dashboard
        return "pending_tax_review"

    if not has_payout_method:
        return "pending_payout_method"

    return "incomplete"


def get_recipient_status_service(db: Session, user: User) -> dict:
    """
    Return the live Trolley recipient status for the current user.
    Makes a single Trolley API call when the user has a recipient ID, and
    caches the top-level status on the User row as a side-effect.
    """
    if not user.trolley_recipient_id:
        return {
            "has_recipient": False,
            "trolley_recipient_id": None,
            "status": None,
            "has_payout_method": False,
            "compliance_state": None,
        }

    try:
        data = trolley_client.get_recipient(user.trolley_recipient_id)
    except Exception as e:
        logger.warning("Trolley get_recipient failed for status check", exc_info=e)
        # Fall back to cached value rather than failing the request
        return {
            "has_recipient": True,
            "trolley_recipient_id": user.trolley_recipient_id,
            "status": user.trolley_recipient_status,
            "has_payout_method": None,
            "compliance_state": None,
        }

    trolley_status: str = data.get("status") or ""
    has_payout_method = bool(data.get("accounts"))
    compliance = data.get("compliance") or {}
    compliance_state = _derive_compliance_state(
        trolley_status, compliance, has_payout_method
    )

    # Persist fresh status so webhook gaps don't leave stale cache
    if user.trolley_recipient_status != trolley_status:
        user.trolley_recipient_status = trolley_status
        db.commit()

    return {
        "has_recipient": True,
        "trolley_recipient_id": user.trolley_recipient_id,
        "status": trolley_status,
        "has_payout_method": has_payout_method,
        "compliance_state": compliance_state,
    }


def request_payout_service(db: Session, user: User, diamonds: int):
    """
    Redeem diamonds for a cash payout via Trolley.

    Steps:
      1. Validate minimum threshold and sufficient balance
      2. Validate user has a registered Trolley recipient
      3. Calculate USD amount (diamonds / DIAMONDS_PER_DOLLAR)
      4. Deduct diamonds and log transaction
      5. Submit payment to Trolley and process immediately
      6. Record PayoutRequest
    """
    if get_processing_payout_for_user(db, user.id):
        raise HTTPException(
            409,
            "You already have a payout in progress. Please wait for it to complete before requesting another.",
        )

    if diamonds < settings.MIN_PAYOUT_DIAMONDS:
        raise HTTPException(
            400,
            f"Minimum payout is {settings.MIN_PAYOUT_DIAMONDS:,} diamonds "
            f"(${settings.MIN_PAYOUT_DIAMONDS / settings.DIAMONDS_PER_DOLLAR:.2f} USD)",
        )

    if diamonds > settings.MAX_PAYOUT_DIAMONDS:
        raise HTTPException(
            400,
            f"Maximum payout is {settings.MAX_PAYOUT_DIAMONDS:,} diamonds "
            f"(${settings.MAX_PAYOUT_DIAMONDS / settings.DIAMONDS_PER_DOLLAR:.2f} USD)",
        )

    if user.diamond_balance < diamonds:
        raise HTTPException(400, "Insufficient diamond balance")

    if not user.trolley_recipient_id:
        raise HTTPException(
            400,
            "Payout account not set up. Please register your payout details first.",
        )

    amount_usd = (Decimal(diamonds) / Decimal(settings.DIAMONDS_PER_DOLLAR)).quantize(
        Decimal("0.01"), rounding=ROUND_DOWN
    )

    if amount_usd <= 0:
        raise HTTPException(
            400,
            "Diamond amount is too small to convert to a payout. Please try a larger amount.",
        )

    # Pre-flight: verify recipient is active and has payment accounts in Trolley.
    # Must run BEFORE the diamond deduction so a validation failure doesn't
    # leave the user with a committed deduction and no refund path.
    try:
        trolley_recipient = trolley_client.get_recipient(user.trolley_recipient_id)
        logger.info(
            "Trolley recipient pre-flight: id=%s status=%s compliance=%s accounts=%s",
            trolley_recipient["id"],
            trolley_recipient["status"],
            trolley_recipient["compliance"],
            trolley_recipient["accounts"],
        )
        if trolley_recipient["status"] != "active":
            compliance_state = _derive_compliance_state(
                trolley_recipient["status"],
                trolley_recipient.get("compliance"),
                bool(trolley_recipient["accounts"]),
            )
            if compliance_state == "pending_tax_review":
                msg = (
                    "Your tax form has been submitted and is awaiting review. "
                    "You'll be notified once your account is approved."
                )
            elif compliance_state == "pending_payout_method":
                msg = (
                    "Please open the payout widget and add your bank or PayPal details "
                    "to complete setup."
                )
            else:
                msg = (
                    "Your payout account is not yet active. "
                    "Please open the payout widget and complete all required steps, then try again."
                )
            raise HTTPException(400, msg)
        if not trolley_recipient["accounts"]:
            raise HTTPException(
                400,
                "Your payout account setup is incomplete. "
                "Please open the payout widget and add your bank or PayPal details, then try again.",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Trolley recipient pre-flight check failed", exc_info=e)
        # Non-fatal: proceed and let the batch call surface any errors

    # Deduct diamonds after pre-flight passes so the balance is reserved.
    # Committed immediately so a concurrent request cannot double-spend.
    user.diamond_balance -= diamonds
    log_diamond_transaction(
        db=db,
        user_id=user.id,
        amount=-diamonds,
        reason="payout_redeem",
    )
    db.commit()

    memo = f"KiKit diamond payout — {diamonds:,} diamonds"

    if settings.PAYOUT_DELAY_DAYS > 0:
        # Schedule the Trolley submission for a future date
        from datetime import datetime, timedelta, timezone

        eta = datetime.now(timezone.utc) + timedelta(days=settings.PAYOUT_DELAY_DAYS)

        payout = create_payout_request(
            db=db,
            user_id=user.id,
            diamonds_redeemed=diamonds,
            amount_usd=amount_usd,
            status=PayoutStatus.scheduled,
        )

        process_scheduled_payout_task.apply_async(
            kwargs={"payout_id": str(payout.id), "user_id": str(user.id)},
            eta=eta,
        )

        logger.info(
            "Payout scheduled: user=%s diamonds=%d usd=%.2f eta=%s payout=%s",
            user.id,
            diamonds,
            amount_usd,
            eta.isoformat(),
            payout.id,
        )
        return payout

    # Immediate submission
    try:
        batch_id, payment_id = trolley_client.create_and_process_payment(
            recipient_id=user.trolley_recipient_id,
            amount_usd=amount_usd,
            memo=memo,
        )
    except (http_requests.HTTPError, MalformedException) as e:
        # Roll back the diamond deduction on Trolley failure
        logger.error("Trolley payment submission failed", exc_info=e)
        user.diamond_balance += diamonds
        log_diamond_transaction(
            db=db,
            user_id=user.id,
            amount=diamonds,
            reason="payout_redeem_rollback",
        )
        db.commit()

        # Surface a specific user-facing message for known Trolley error codes
        error_str = str(e)
        if "non_sufficient_funds" in error_str:
            user_msg = "Payout service is temporarily unavailable. Your diamonds have been refunded."
        elif (
            "batch_failed_validation" in error_str
            or "missing active recipient" in error_str
        ):
            user_msg = (
                "Your payout account setup is incomplete. "
                "Please open the payout widget and add your bank or PayPal details, then try again."
            )
        else:
            user_msg = "Payment submission failed. Your diamonds have been refunded."

        raise HTTPException(502, user_msg)

    try:
        payout = create_payout_request(
            db=db,
            user_id=user.id,
            diamonds_redeemed=diamonds,
            amount_usd=amount_usd,
            trolley_batch_id=batch_id,
            trolley_payment_id=payment_id,
        )
    except Exception as e:
        # Trolley payment is live but our DB record failed to save.
        # Log everything needed for manual reconciliation — do NOT refund
        # diamonds here because the payment is genuinely processing.
        logger.error(
            "RECONCILIATION REQUIRED: Trolley payment submitted but PayoutRequest "
            "could not be saved. user_id=%s batch_id=%s payment_id=%s amount_usd=%s error=%s",
            user.id,
            batch_id,
            payment_id,
            amount_usd,
            e,
            exc_info=e,
        )
        raise HTTPException(
            500,
            "Your payout was submitted but we encountered an error recording it. "
            "Please contact support — your payment is being processed.",
        )

    logger.info(
        "Payout submitted: user=%s diamonds=%d usd=%.2f batch=%s payment=%s",
        user.id,
        diamonds,
        amount_usd,
        batch_id,
        payment_id,
    )
    return payout


def get_payout_history_service(db: Session, user_id: UUID, params: Params):
    return get_user_payouts(db, user_id, params)


# ── Webhook handling ─────────────────────────────────────────────────────────

# Trolley event types that indicate a payment completed or failed
_COMPLETED_EVENTS = {"payment.processed"}
_FAILED_EVENTS = {
    "payment.failed",
    "payment.returned",
}
_RECIPIENT_EVENTS = {"recipient.updated"}


def _handle_recipient_updated(db: Session, payload: dict) -> dict:
    """
    Handle Trolley recipients.updated event.

    Updates the cached trolley_recipient_status on the User row and, when
    the recipient transitions to "active", sends a push notification so the
    user knows they can now request a payout.
    """
    recipient = payload.get("recipient", {})
    recipient_id = recipient.get("id")
    new_status = recipient.get("status")

    if not recipient_id or not new_status:
        logger.warning("recipients.updated: missing id or status in payload")
        return {"status": "ignored"}

    user = get_user_by_trolley_recipient_id(db, recipient_id)
    if not user:
        logger.warning(
            "recipients.updated: no user found for recipient_id=%s", recipient_id
        )
        return {"status": "not_found"}

    previous_status = user.trolley_recipient_status
    if previous_status == new_status:
        return {"status": "no_change"}

    user.trolley_recipient_status = new_status
    db.commit()
    logger.info(
        "Trolley recipient status updated: user=%s %s → %s",
        user.id,
        previous_status,
        new_status,
    )

    if new_status == "active" and previous_status != "active":
        try:
            notify_user(
                db=db,
                user_id=user.id,
                title="Payout account approved!",
                body="Your payout account is now active. You can request a payout anytime.",
                type="payout_account_active",
                data={"trolley_recipient_id": recipient_id},
            )
        except Exception as e:
            # Notification failure must not fail the webhook response
            logger.error(
                "Failed to send payout_account_active notification for user=%s",
                user.id,
                exc_info=e,
            )

    return {"status": "ok"}


def handle_trolley_webhook(db: Session, event_type: str, payload: dict) -> dict:
    """
    Handle incoming Trolley webhook events.

    Supported events:
      payment.status.completed  – mark payout completed
      payment.status.failed     – mark payout failed, refund diamonds
      payment.status.returned   – same as failed
      recipients.updated        – sync cached recipient status, notify on activation
    """
    if event_type in _RECIPIENT_EVENTS:
        return _handle_recipient_updated(db, payload)

    if event_type not in _COMPLETED_EVENTS | _FAILED_EVENTS:
        return {"status": "ignored"}

    payment_id = payload.get("payment", {}).get("id")
    if not payment_id:
        return {"status": "ignored"}

    payout = get_payout_by_trolley_payment_id(db, payment_id)
    if not payout:
        logger.warning("Trolley webhook: no payout found for payment_id=%s", payment_id)
        return {"status": "not_found"}

    if event_type in _COMPLETED_EVENTS:
        update_payout_status(db, payout, PayoutStatus.completed)
        db.commit()
        logger.info("Payout completed: payment_id=%s", payment_id)

    elif event_type in _FAILED_EVENTS:
        reason = payload.get("payment", {}).get("failureMessage", "Payment failed")

        # Refund diamonds and update status in a single commit so a crash
        # between the two can never leave the user with no diamonds and a
        # finalized "failed" status.
        user = get_user_by_id(db, str(payout.user_id))
        if user:
            user.diamond_balance += payout.diamonds_redeemed
            log_diamond_transaction(
                db=db,
                user_id=user.id,
                amount=payout.diamonds_redeemed,
                reason="payout_failed_refund",
            )
        else:
            logger.error(
                "RECONCILIATION REQUIRED: payout failed but user not found for refund. "
                "payout_id=%s user_id=%s diamonds=%s payment_id=%s",
                payout.id,
                payout.user_id,
                payout.diamonds_redeemed,
                payment_id,
            )

        update_payout_status(db, payout, PayoutStatus.failed, failure_reason=reason)
        db.commit()

        logger.warning(
            "Payout failed: payment_id=%s reason=%s — diamonds %s",
            payment_id,
            reason,
            "refunded" if user else "NOT refunded — manual intervention required",
        )

    return {"status": "ok"}
