from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi_pagination import Params
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.core.rate_limit import ip_rate_limit
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.gifts import GiftSchema, SendGiftRequest
from app.schemas.response import ResponseModel
from app.services.gift import (
    fetch_gift_by_id,
    fetch_received_gifts,
    fetch_sent_gifts,
    list_gifts_service,
    send_gift,
)
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/gifts", tags=["Gifts"])


@router.get("", response_model=ResponseModel)
def list_gifts(
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Fetch a paginated list of all active gifts."""
    try:
        gifts = list_gifts_service(db, params)
        logger.info(f"Fetched {len(gifts.items)} active gifts")

        return success_response(message="Gifts fetched successfully", data=gifts)
    except Exception as e:
        logger.error("Error fetching gifts", exc_info=e)
        return error_response(message="Failed to fetch gifts", status_code=500)


@router.get("/{gift_id}", response_model=ResponseModel)
def get_gift_detail(
    gift_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Fetch details of a specific gift by its ID."""
    try:
        gift = fetch_gift_by_id(db, gift_id)

        if not gift:
            logger.warning(f"Gift with ID {gift_id} not found or inactive")
            return error_response(message="Gift not found", status_code=404)

        data = GiftSchema.model_validate(gift).model_dump()

        logger.info(f"Fetched details for gift: {gift.name}")
        return success_response(message="Gift details fetched successfully", data=data)
    except Exception as e:
        logger.error(f"Error fetching gift {gift_id}", exc_info=e)
        return error_response(message="Failed to fetch gift details", status_code=500)


@router.post(
    "/send",
    response_model=ResponseModel,
    dependencies=[
        Depends(ip_rate_limit("gift_send", max_requests=30, window_seconds=60))
    ],
)
def post_send_gift(
    payload: SendGiftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Send a gift from the current user to another user."""
    try:
        logger.info(
            f"User {current_user.id} attempting to send gift {payload.gift_id} to {payload.receiver_id}"
        )

        transaction = send_gift(
            db=db,
            sender_id=current_user.id,
            receiver_id=payload.receiver_id,
            gift_id=payload.gift_id,
            live_room_id=payload.live_room_id,
        )

        return success_response(
            message="Gift sent successfully!",
            data={
                "transaction_id": str(transaction.id),
                "new_coin_balance": current_user.coin_balance,
                "new_diamond_balance": current_user.diamond_balance,
            },
        )

    except HTTPException as he:
        return error_response(message=he.detail, status_code=he.status_code)

    except Exception as e:
        logger.error(f"Critical error in gift sending: {str(e)}", exc_info=True)
        return error_response(
            message="An unexpected error occurred while sending the gift",
            status_code=500,
        )


@router.get("/history/received", response_model=ResponseModel)
def list_received_gifts(
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Fetch gifts received by the current user."""
    try:
        paginated_data = fetch_received_gifts(db, current_user.id, params)

        return success_response(
            data=paginated_data, message="Received gifts fetched successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching received gifts: {e}")
        return error_response(message="Failed to fetch history")


@router.get("/history/sent", response_model=ResponseModel)
def list_sent_gifts(
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Fetch gifts sent by the current user."""
    try:
        paginated_data = fetch_sent_gifts(db, current_user.id, params)

        return success_response(
            data=paginated_data, message="Sent gifts fetched successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching sent gifts: {e}")
        return error_response(message="Failed to fetch history")
