"""Handle verified RevenueCat purchase webhooks."""

from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.core.enums import SubscriptionType
from app.core.logger import logger
from app.repositories.coin_transaction import log_coin_transaction
from app.repositories.profile import (
    add_purchased_calls,
    get_profile_by_user_id,
    set_profile_subscription,
)
from app.repositories.user import get_user_by_id
from app.services.coin_packs import get_coin_pack

COIN_EVENT_TYPES = {
    "INITIAL_PURCHASE",
    "NON_RENEWING_PURCHASE",
    "RENEWAL",
}
SUBSCRIPTION_PRODUCTS = {
    "com.kikit.subscription.monthly": SubscriptionType.MONTHLY,
    "com.kikit.subscription.annual": SubscriptionType.YEARLY,
}
EXTRA_CALL_PRODUCT = "com.kikit.call_1pack"


def _event_cache_key(event_id: str) -> str:
    return f"revenuecat:event:{event_id}"


def _already_processed(event_id: str | None) -> bool:
    if not event_id:
        return False
    return cache_get(_event_cache_key(event_id)) is not None


def _mark_processed(event_id: str | None) -> None:
    if event_id:
        cache_set(_event_cache_key(event_id), {"processed": True}, ttl=60 * 60 * 24 * 30)


def process_revenuecat_event(db: Session, event: dict) -> dict:
    """Apply a verified RevenueCat webhook event."""
    event_id = event.get("id")
    if _already_processed(event_id):
        logger.info("RevenueCat event already processed: %s", event_id)
        return {"status": "duplicate"}

    event_type = event.get("type", "")
    product_id = event.get("product_id") or ""
    app_user_id = event.get("app_user_id")

    if not app_user_id:
        logger.warning("RevenueCat event missing app_user_id: %s", event_id)
        return {"status": "ignored", "reason": "missing_app_user_id"}

    user = get_user_by_id(db, app_user_id)
    if not user:
        logger.warning("RevenueCat user not found: %s", app_user_id)
        return {"status": "ignored", "reason": "user_not_found"}

    if event_type in {"CANCELLATION", "EXPIRATION"}:
        _mark_processed(event_id)
        return {"status": "ignored", "reason": event_type.lower()}

    if product_id == EXTRA_CALL_PRODUCT and event_type in COIN_EVENT_TYPES:
        profile = get_profile_by_user_id(db, user.id)
        if not profile:
            raise ValueError("Profile not found for extra call purchase")
        add_purchased_calls(db, profile, 1)
        db.commit()
        _mark_processed(event_id)
        return {"status": "extra_call_granted"}

    if product_id in SUBSCRIPTION_PRODUCTS and event_type in COIN_EVENT_TYPES:
        profile = get_profile_by_user_id(db, user.id)
        if not profile:
            raise ValueError("Profile not found for subscription purchase")
        set_profile_subscription(
            db, profile, SUBSCRIPTION_PRODUCTS[product_id]
        )
        db.commit()
        _mark_processed(event_id)
        return {"status": "subscription_updated", "product_id": product_id}

    if event_type in COIN_EVENT_TYPES and product_id.startswith("com.kikit.coins."):
        coin_pack = get_coin_pack(product_id)
        user.coin_balance += coin_pack.amount
        log_coin_transaction(
            db,
            user_id=user.id,
            amount=coin_pack.amount,
            reason=f"purchase:{product_id}",
        )
        db.commit()
        _mark_processed(event_id)
        return {
            "status": "coins_credited",
            "product_id": product_id,
            "coins": coin_pack.amount,
        }

    _mark_processed(event_id)
    return {"status": "ignored", "reason": "unhandled_product", "product_id": product_id}
