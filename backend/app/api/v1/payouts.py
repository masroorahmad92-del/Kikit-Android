from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from fastapi_pagination import Params
from sqlalchemy.orm import Session

from app.core import settings
from app.core import trolley as trolley_client
from app.core.logger import logger
from app.core.rate_limit import user_rate_limit
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.schemas.payout import PayoutRequestCreate, PayoutRequestSchema
from app.schemas.response import ResponseModel
from app.services.payout import (
    get_or_create_recipient_service,
    get_payout_history_service,
    get_recipient_status_service,
    handle_trolley_webhook,
    request_payout_service,
)
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/payouts", tags=["Payouts"])


@router.get("/rates", response_model=ResponseModel)
def get_payout_rates() -> JSONResponse:
    """
    Return the current diamond conversion rates and payout limits.

    - `diamonds_per_dollar`: How many diamonds equal $1 USD
    - `diamond_price_usd`: Value of one diamond in USD
    - `coins_to_diamonds_ratio`: Fraction of coin purchase value returned as diamonds (after Apple fee)
    - `min_payout_diamonds`: Minimum diamonds required to request a payout
    - `max_payout_diamonds`: Maximum diamonds per payout request
    - `payout_processing_days`: Expected days until payout is processed
    """
    return success_response(
        message="Payout rates fetched",
        data={
            "diamonds_per_dollar": settings.DIAMONDS_PER_DOLLAR,
            "diamond_price_usd": round(1 / settings.DIAMONDS_PER_DOLLAR, 4),
            "coins_to_diamonds_ratio": settings.COINS_TO_DIAMONDS_RATIO,
            "min_payout_diamonds": settings.MIN_PAYOUT_DIAMONDS,
            "max_payout_diamonds": settings.MAX_PAYOUT_DIAMONDS,
            "payout_processing_days": settings.PAYOUT_PROCESSING_DAYS,
        },
    )


@router.get("/convert", response_model=ResponseModel)
def convert_diamonds_to_usd(
    diamonds: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> JSONResponse:
    """
    Convert a given number of diamonds to USD value.
    Useful for real-time conversion display in the UI.
    Example: GET /api/v1/payouts/convert?diamonds=1000 returns $10.00
    """
    usd_value = round(diamonds / settings.DIAMONDS_PER_DOLLAR, 2)
    return success_response(
        message="Conversion calculated",
        data={
            "diamonds": diamonds,
            "usd_value": usd_value,
            "diamond_price_usd": round(1 / settings.DIAMONDS_PER_DOLLAR, 4),
        },
    )


@router.post("/recipient", response_model=ResponseModel)
def setup_recipient(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> JSONResponse:
    """
    Register the current user as a Trolley payout recipient (first call only)
    and return a short-lived widget token + URL.

    The frontend should open the widget URL so the user can enter their bank
    or PayPal details via Trolley's hosted UI.
    """
    try:
        data = get_or_create_recipient_service(db, current_user)
        return success_response(message="Payout account ready", data=data)
    except Exception as e:
        logger.error("Error setting up payout recipient", exc_info=e)
        return error_response(
            message=str(e.detail) if hasattr(e, "detail") else str(e),
            status_code=getattr(e, "status_code", 500),
        )


@router.get("/recipient", response_model=ResponseModel)
def get_recipient(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> JSONResponse:
    """
    Return the live Trolley recipient status for the current user.

    The response includes a `compliance_state` field the frontend can use
    to show the right message:
    - `active`                – ready to receive payouts
    - `pending_tax_review`    – tax form submitted, waiting for platform approval
    - `pending_payout_method` – compliance approved but no bank/PayPal linked
    - `incomplete`            – needs to complete setup via the widget
    """
    try:
        data = get_recipient_status_service(db, current_user)
        return success_response(message="Recipient status fetched", data=data)
    except Exception as e:
        logger.error("Error fetching recipient status", exc_info=e)
        return error_response(
            message="Failed to fetch recipient status", status_code=500
        )


@router.post(
    "/request",
    response_model=ResponseModel,
    dependencies=[
        Depends(user_rate_limit("payout_request", max_requests=3, window_seconds=60))
    ],
)
def request_payout(
    payload: PayoutRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> JSONResponse:
    """
    Redeem diamonds for a cash payout.

    - Minimum: {MIN_PAYOUT_DIAMONDS} diamonds
    - Rate: {DIAMONDS_PER_DOLLAR} diamonds = $1 USD
    - Payout is submitted to Trolley immediately and processed by their pipeline.
    - Diamonds are deducted upfront; refunded automatically if the payment fails.
    """
    try:
        payout = request_payout_service(db, current_user, payload.diamonds)
        data = PayoutRequestSchema.model_validate(payout).model_dump()
        return success_response(message="Payout submitted successfully", data=data)
    except Exception as e:
        logger.error("Error requesting payout", exc_info=e)
        return error_response(
            message=str(e.detail) if hasattr(e, "detail") else str(e),
            status_code=getattr(e, "status_code", 500),
        )


@router.get("/history", response_model=ResponseModel)
def payout_history(
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> JSONResponse:
    """Return a paginated list of the current user's payout requests."""
    try:
        page = get_payout_history_service(db, current_user.id, params)
        data = page.model_copy(
            update={
                "items": [
                    PayoutRequestSchema.model_validate(p).model_dump()
                    for p in page.items
                ]
            }
        )
        return success_response(message="Payout history fetched", data=data)
    except Exception as e:
        logger.error("Error fetching payout history", exc_info=e)
        return error_response(message="Failed to fetch payout history", status_code=500)


@router.post("/webhook", status_code=200)
async def trolley_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receive Trolley webhook events and update payout statuses.
    Verifies HMAC-SHA256 signature via the X-PaymentRails-Signature header.
    """
    raw_body = await request.body()
    signature = request.headers.get("X-PaymentRails-Signature", "")

    if not trolley_client.verify_webhook_signature(raw_body, signature):
        logger.warning("Trolley webhook: invalid signature")
        return JSONResponse({"status": "unauthorized"}, status_code=401)

    try:
        body = await request.json()
    except Exception:
        return {"status": "invalid_payload"}

    event_type = body.get("type") or f"{body.get('model', '')}.{body.get('action', '')}"
    logger.info("Trolley webhook received: %s", event_type)

    payload = body.get("body", body)
    return handle_trolley_webhook(db, event_type, payload)
