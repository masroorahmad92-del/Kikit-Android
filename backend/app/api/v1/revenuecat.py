from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core import settings
from app.core.logger import logger
from app.database.session import get_db
from app.services.revenuecat import process_revenuecat_event

router = APIRouter(prefix="/revenuecat", tags=["RevenueCat"])


@router.post("/webhook", status_code=200)
async def revenuecat_webhook(
    request: Request,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    """Verify RevenueCat purchases and credit coins/subscriptions server-side."""
    if settings.REVENUECAT_WEBHOOK_SECRET:
        expected = f"Bearer {settings.REVENUECAT_WEBHOOK_SECRET}"
        if authorization != expected:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        payload = await request.json()
    except Exception:
        return JSONResponse({"status": "invalid_payload"}, status_code=400)

    event = payload.get("event") or {}
    logger.info(
        "RevenueCat webhook: type=%s product=%s user=%s",
        event.get("type"),
        event.get("product_id"),
        event.get("app_user_id"),
    )

    try:
        result = process_revenuecat_event(db, event)
    except ValueError as exc:
        logger.error("RevenueCat webhook error: %s", exc)
        return JSONResponse({"status": "error", "detail": str(exc)}, status_code=400)
    except Exception as exc:
        logger.error("RevenueCat webhook failed: %s", exc, exc_info=True)
        return JSONResponse({"status": "error"}, status_code=500)

    return JSONResponse(result)
