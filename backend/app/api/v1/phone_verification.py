from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.response import ResponseModel
from app.services.phone_verification_service import (
    check_phone_exists_service,
    send_phone_otp_service,
    verify_phone_otp_service,
)
from app.utils.response import success_response

router = APIRouter(prefix="/phone-verification", tags=["Phone Verification"])


@router.post("/check", response_model=ResponseModel)
async def check_phone_exists(
    phone_number: str = Body(..., embed=True),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Check if a phone number is already registered."""
    data = check_phone_exists_service(
        db=db,
        phone_number=phone_number,
    )

    return success_response(
        data=data,
        message="Phone number checked",
    )


@router.post("/send", response_model=ResponseModel)
async def send_phone_otp(
    user_id: str = Body(..., embed=True),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Send an OTP code to the user's phone number."""
    data = send_phone_otp_service(
        db=db,
        user_id=user_id,
    )

    return success_response(
        data=data,
        message="OTP sent to phone number",
    )


@router.post("/verify", response_model=ResponseModel)
async def verify_phone_otp(
    user_id: str = Body(..., embed=True),
    otp: str = Body(...),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Verify the OTP code for the user's phone number."""
    verify_phone_otp_service(
        db=db,
        user_id=user_id,
        code=otp,
    )

    return success_response(
        message="Phone number verified successfully",
    )
