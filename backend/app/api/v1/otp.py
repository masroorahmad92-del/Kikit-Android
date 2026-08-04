from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.enums import OTPSrcEnum
from app.core.rate_limit import ip_rate_limit
from app.database.session import get_db
from app.schemas.response import ResponseModel
from app.services.otp_service import resend_otp_service, verify_otp_service
from app.utils.response import success_response

router = APIRouter(prefix="/otp", tags=["OTP"])


@router.post(
    "/verify",
    response_model=ResponseModel,
    dependencies=[
        Depends(ip_rate_limit("otp_verify", max_requests=5, window_seconds=60))
    ],
)
async def verify_otp(
    recipient: str = Body(...),
    code: str = Body(...),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Verify the provided OTP code for the given recipient."""
    data = verify_otp_service(
        db=db,
        recipient=recipient,
        code=code,
    )

    return success_response(
        data=data,
        message="OTP verified successfully",
    )


@router.post(
    "/resend",
    response_model=ResponseModel,
    dependencies=[
        Depends(ip_rate_limit("otp_resend", max_requests=3, window_seconds=60))
    ],
)
async def resend_otp(
    recipient: str = Body(...),
    source: OTPSrcEnum = Body(OTPSrcEnum.EMAIL),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Resend an OTP code to the given recipient."""
    data = resend_otp_service(
        db=db,
        recipient=recipient,
        source=source,
    )

    return success_response(
        data=data,
        message="OTP resent successfully",
    )
