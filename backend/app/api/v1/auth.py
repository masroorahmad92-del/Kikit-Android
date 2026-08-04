from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.response import ResponseModel
from app.schemas.sso import AppleAuthRequest, GoogleAuthRequest
from app.schemas.token import RefreshTokenRequest, TokenResponse
from app.services.apple_service import apple_login
from app.services.google_service import google_login
from app.services.token_service import refresh_tokens
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/refresh", response_model=ResponseModel)
async def refresh_token(
    request: RefreshTokenRequest = Body(...),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Refresh access and refresh tokens."""
    tokens = refresh_tokens(request.refresh_token, db)
    data = ResponseModel(**tokens)

    return success_response(
        message="Tokens refreshed successfully",
        data=data,
    )


@router.post("/google", response_model=ResponseModel)
async def google_auth(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Authenticate user via Google SSO."""
    auth_data = await google_login(request.id_token, db, full_name=request.full_name)
    data = TokenResponse(**auth_data)

    return success_response(
        message="Google authentication successful",
        data=data,
    )


@router.post("/apple", response_model=ResponseModel)
async def apple_auth(
    request: AppleAuthRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Authenticate user via Apple SSO."""
    auth_data = await apple_login(request.id_token, db, full_name=request.full_name)
    data = TokenResponse(**auth_data)

    return success_response(
        message="Apple authentication successful",
        data=data,
    )
