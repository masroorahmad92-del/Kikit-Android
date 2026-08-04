from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile import (
    ProfileRead,
    ProfileUpdate,
    PurchasedCallsAdd,
    SubscriptionRead,
    SubscriptionSet,
)
from app.schemas.response import ResponseModel
from app.services.profile import (
    add_purchased_calls_service,
    get_profile_by_id_service,
    get_profile_by_user_id_service,
    get_profile_service,
    increment_calls_service,
    remove_subscription_service,
    set_subscription_service,
    update_profile_service,
    verify_profile_service,
)
from app.utils.response import success_response

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.patch("/", response_model=ResponseModel, status_code=status.HTTP_200_OK)
async def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Update the current user's profile."""
    updated_profile = await update_profile_service(
        db, current_user.id, payload.model_dump(exclude_unset=True)
    )
    return success_response(
        message="Profile updated successfully",
        data=ProfileRead.model_validate(updated_profile, from_attributes=True),
    )


@router.get("/me", response_model=ResponseModel, status_code=status.HTTP_200_OK)
async def get_my_profile(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> JSONResponse:
    """Get the current user's profile."""
    try:
        profile = get_profile_service(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return success_response(
        message="Profile fetched successfully",
        data=ProfileRead.model_validate(profile, from_attributes=True),
    )


@router.get(
    "/{profile_id}", response_model=ResponseModel, status_code=status.HTTP_200_OK
)
async def get_profile_by_id(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Get a specific profile by ID."""
    try:
        profile = get_profile_by_id_service(db, profile_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return success_response(
        message="Profile fetched successfully",
        data=ProfileRead.model_validate(profile, from_attributes=True),
    )


@router.get(
    "/user/{user_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
)
async def get_profile_by_user_id_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Get a profile by user ID."""
    try:
        profile = get_profile_by_user_id_service(db, user_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return success_response(
        message="Profile fetched successfully",
        data=ProfileRead.model_validate(profile, from_attributes=True),
    )


@router.post(
    "/subscription", response_model=ResponseModel, status_code=status.HTTP_200_OK
)
async def set_subscription(
    payload: SubscriptionSet,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Set or update the subscription plan (monthly/yearly) for the current user's profile."""
    try:
        profile = set_subscription_service(
            db, current_user.id, payload.subscription_type
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return success_response(
        message="Subscription updated successfully",
        data=SubscriptionRead.model_validate(profile, from_attributes=True),
    )


@router.delete(
    "/subscription", response_model=ResponseModel, status_code=status.HTTP_200_OK
)
async def delete_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Remove the subscription from the current user's profile."""
    try:
        profile = remove_subscription_service(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return success_response(
        message="Subscription removed successfully",
        data=SubscriptionRead.model_validate(profile, from_attributes=True),
    )


@router.post(
    "/subscription/call", response_model=ResponseModel, status_code=status.HTTP_200_OK
)
async def increment_call_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Increment the calls_taken counter for the current user's profile."""
    try:
        profile = increment_calls_service(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return success_response(
        message="Call count updated",
        data=SubscriptionRead.model_validate(profile, from_attributes=True),
    )


@router.post(
    "/calls/purchase", response_model=ResponseModel, status_code=status.HTTP_200_OK
)
async def add_purchased_calls(
    payload: PurchasedCallsAdd,
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Extra calls must be granted via verified RevenueCat webhooks."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Calls cannot be granted directly. Complete an in-app purchase.",
    )


@router.post("/verify", response_model=ResponseModel, status_code=status.HTTP_200_OK)
async def verify_profile(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Verify the current user's profile using an uploaded image."""
    try:
        is_verified = await verify_profile_service(db, current_user.id, file)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

    return success_response(
        message="Verification completed." if is_verified else "Verification failed.",
        data={"verified": is_verified},
    )
