from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileRead
from app.schemas.response import ResponseModel
from app.services.user_block import (
    block_user_service,
    list_blocked_users_service,
    unblock_user_service,
)
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/blocks", tags=["Blocks"])


@router.post("/{blocked_user_id}", response_model=ResponseModel)
def block_user(
    blocked_user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    try:
        data = block_user_service(db, current_user.id, blocked_user_id)
        return success_response(message="User blocked successfully", data=data)
    except ValueError as e:
        return error_response(message=str(e), status_code=400)
    except LookupError as e:
        return error_response(message=str(e), status_code=404)
    except Exception as e:
        logger.error("Failed to block user %s", blocked_user_id, exc_info=e)
        return error_response(message="Failed to block user", status_code=500)


@router.delete("/{blocked_user_id}", response_model=ResponseModel)
def unblock_user(
    blocked_user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    try:
        data = unblock_user_service(db, current_user.id, blocked_user_id)
        return success_response(message="User unblocked successfully", data=data)
    except Exception as e:
        logger.error("Failed to unblock user %s", blocked_user_id, exc_info=e)
        return error_response(message="Failed to unblock user", status_code=500)


@router.get("", response_model=ResponseModel)
def list_blocked_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    try:
        blocks = list_blocked_users_service(db, current_user.id)
        profiles = []

        for block in blocks:
            blocked_user = block.blocked_user
            profile = blocked_user.profile if blocked_user else None
            if not profile:
                continue

            data = ProfileRead.model_validate(
                profile, from_attributes=True
            ).model_dump()
            data["block_id"] = block.id
            data["blocked_at"] = block.created_at
            data["blocked_user_id"] = blocked_user.id
            profiles.append(data)

        return success_response(
            message="Blocked users fetched successfully",
            data={"profiles": profiles},
        )
    except Exception as e:
        logger.error("Failed to list blocked users", exc_info=e)
        return error_response(message="Failed to load blocked users", status_code=500)
