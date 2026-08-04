from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.rate_limit import ip_rate_limit
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.response import ResponseModel
from app.schemas.user import UserAuthData, UserInfo
from app.services.user import (
    delete_account_service,
    login_service,
    signup_service,
)
from app.utils.response import success_response

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/signup", response_model=ResponseModel, status_code=status.HTTP_201_CREATED
)
async def signup(user: UserAuthData, db: Session = Depends(get_db)):
    """Create a new user account."""
    new_user = signup_service(db, user)
    return success_response(
        data=UserInfo.model_validate(new_user), message="User created successfully"
    )


@router.post(
    "/login",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(ip_rate_limit("login", max_requests=10, window_seconds=60))],
)
async def login(user: UserAuthData, db: Session = Depends(get_db)):
    """Authenticate a user and send an OTP to their email."""
    result = login_service(db, user)
    if result.get("otp_bypass"):
        return success_response(data=result, message="Login successful")
    return success_response(
        data={"recipient": result["recipient"]}, message="OTP sent successfully"
    )


@router.delete("/me", response_model=ResponseModel, status_code=status.HTTP_200_OK)
async def delete_account(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Delete the current user's account."""
    try:
        delete_account_service(db, current_user)
    except HTTPException as e:
        raise e
    return success_response(message="Account deleted successfully")


@router.patch(
    "/me/balance", response_model=ResponseModel, status_code=status.HTTP_403_FORBIDDEN
)
async def update_balance(
    current_user: User = Depends(get_current_user),
):
    """Balance changes must come from verified IAP webhooks, not the client."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Balance cannot be updated directly. Complete an in-app purchase.",
    )
