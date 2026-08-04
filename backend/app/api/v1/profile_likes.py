from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile_like import SparkCreate
from app.schemas.profile import ProfileRead
from app.schemas.response import ResponseModel
from app.services.profile import (
    delete_profile_like_service,
    fetch_liked_profiles,
    get_ignored_likers_service,
    get_profile_by_user_id_service,
    ignore_profile_like_service,
    like_profile,
    spark_profile,
    unignore_profile_like_service,
    unlike_profile_service,
)
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/profile-likes", tags=["Profile Likes"])


@router.post("/{profile_id}/like", response_model=ResponseModel)
def toggle_like(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Like or unlike a profile."""
    try:
        liked, is_matched, match_data = like_profile(db, current_user, profile_id)
        message = (
            "Profile liked successfully" if liked else "Profile unliked successfully"
        )

        response_data = {"liked": liked, "is_matched": is_matched}
        if match_data:
            response_data["match"] = match_data
            if match_data.get("channel_id"):
                response_data["channel_id"] = match_data["channel_id"]

        return success_response(message=message, data=response_data)
    except ValueError as ve:
        return error_response(message=str(ve), status_code=400)
    except PermissionError as pe:
        return error_response(message=str(pe), status_code=403)
    except Exception as e:
        logger.error(f"Error toggling like for profile {profile_id}", exc_info=e)
        return error_response(message="Failed to toggle like", status_code=500)


@router.post("/{profile_id}/spark", response_model=ResponseModel)
def send_spark(
    profile_id: str,
    payload: SparkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Send an interest-first Spark without toggling the like off."""
    try:
        liked, is_matched, match_data, channel_id = spark_profile(
            db,
            current_user,
            profile_id,
            payload.model_dump(exclude_unset=True),
        )
        response_data = {"liked": liked, "is_matched": is_matched}
        if match_data:
            response_data["match"] = match_data
        if channel_id:
            response_data["channel_id"] = channel_id

        return success_response(message="Spark sent successfully", data=response_data)
    except ValueError as ve:
        return error_response(message=str(ve), status_code=400)
    except PermissionError as pe:
        return error_response(message=str(pe), status_code=403)
    except Exception as e:
        logger.error(f"Error sending spark for profile {profile_id}", exc_info=e)
        return error_response(message="Failed to send Spark", status_code=500)


@router.get("/mine", response_model=ResponseModel)
def my_liked_profiles(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    try:
        """Fetch profiles liked by the current user."""
        my_profile = get_profile_by_user_id_service(db, current_user.id)
        if not my_profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        response_data = fetch_liked_profiles(
            db, my_profile, mode="liked", search=search
        )
        return success_response(
            message="Liked profiles fetched successfully", data=response_data
        )
    except Exception as e:
        logger.error(f"Error fetching my liked profiles", exc_info=e)
        return error_response(message="Failed to fetch profiles", status_code=500)


@router.get("/liked-me", response_model=ResponseModel)
def profiles_that_liked_me(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    try:
        """Fetch profiles that have liked the current user's profile."""
        my_profile = get_profile_by_user_id_service(db, current_user.id)
        if not my_profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        response_data = fetch_liked_profiles(
            db, my_profile, mode="liked_me", search=search
        )
        return success_response(
            message="Profiles who liked you fetched successfully", data=response_data
        )
    except Exception as e:
        logger.error(f"Error fetching profiles that liked me", exc_info=e)
        return error_response(message="Failed to fetch profiles", status_code=500)


@router.get("/ignored", response_model=ResponseModel)
def list_ignored_profiles(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> JSONResponse:
    """Fetch profiles that the current user has ignored from their 'Liked Me' list."""
    try:
        my_profile = get_profile_by_user_id_service(db, current_user.id)
        if not my_profile:
            return error_response(message="Profile not found", status_code=404)

        ignored_profiles = get_ignored_likers_service(db, my_profile.id)

        data = [ProfileRead.model_validate(p).model_dump() for p in ignored_profiles]

        return success_response(
            message="Ignored profiles fetched successfully", data={"profiles": data}
        )
    except Exception as e:
        logger.error(f"Error fetching ignored profiles", exc_info=e)
        return error_response(message="Failed to fetch ignored list", status_code=500)


@router.post("/{target_profile_id}/ignore", response_model=ResponseModel)
def ignore_liker(
    target_profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        my_profile = get_profile_by_user_id_service(db, current_user.id)
        ignore_profile_like_service(db, my_profile.id, target_profile_id)

        return success_response(message="Profile removed from your likes list")
    except Exception as e:
        logger.error(f"Error ignoring profile", exc_info=e)
        return error_response(message="Failed to remove profile", status_code=500)


@router.post("/{target_profile_id}/unignore", response_model=ResponseModel)
def unignore_liker(
    target_profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        my_profile = get_profile_by_user_id_service(db, current_user.id)
        unignore_profile_like_service(db, my_profile.id, target_profile_id)

        return success_response(message="Profile restored to your likes list")
    except Exception as e:
        logger.error(f"Error unignoring profile", exc_info=e)
        return error_response(message="Failed to restore profile", status_code=500)


@router.post("/{profile_id}/unlike", response_model=ResponseModel)
def unlike_profile_endpoint(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Unlike a profile."""
    try:
        unliked = unlike_profile_service(db, current_user, profile_id)
        if unliked:
            return success_response(
                message="Profile unliked successfully", data={"unliked": True}
            )
        else:
            return error_response(message="Profile was not liked", status_code=400)
    except ValueError as ve:
        logger.warning(f"Value error unliking profile {profile_id}: {ve}")
        return error_response(message=str(ve), status_code=404)
    except Exception as e:
        logger.error(f"Error unliking profile {profile_id}", exc_info=e)
        return error_response(message="Failed to unlike profile", status_code=500)


@router.delete("/{profile_id}/like", response_model=ResponseModel)
def delete_profile_like(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Delete a profile like (idempotent)."""

    deleted = delete_profile_like_service(
        db=db,
        current_user=current_user,
        liked_profile_id=profile_id,
    )

    return success_response(
        message="Profile like deleted",
        data={"deleted": deleted},
    )
