from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/profile-skip", tags=["Matches"])


@router.post("/{profile_id}", status_code=status.HTTP_200_OK)
def skip_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Records a skip action from the current user toward another profile.
    """
    from app.services.profile_skip import skip_profile

    # Defensive check: ensure the current user actually has a profile profile
    if not current_user.profile:
        return error_response(message="User profile not found", status_code=404)

    try:
        skip_profile(
            db=db,
            skipper=current_user.profile,
            skipped_id=profile_id,
        )
        return success_response(message="Profile skipped successfully")

    except ValueError as e:
        return error_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Unexpected error in skip_profile: {e}", exc_info=True)
        return error_response(
            message="An internal server error occurred",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
