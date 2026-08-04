from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationListData
from app.schemas.response import ResponseModel
from app.services.notification import (
    get_unread_count_service,
    get_user_notifications_service,
    mark_all_notifications_read_service,
    mark_notification_read_service,
)
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ResponseModel)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """List notifications for the current user."""
    try:
        data = get_user_notifications_service(db, current_user.id)
        logger.info(f"Fetched {len(data)} notifications for user {current_user.id}")

        return success_response(
            message="Notifications fetched successfully",
            data=NotificationListData(notifications=data).model_dump(),
        )
    except Exception as e:
        logger.error(
            f"Error fetching notifications for user {current_user.id}", exc_info=e
        )
        return error_response(message="Failed to fetch notifications", status_code=500)


@router.get("/unread-count", response_model=ResponseModel)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Get the count of unread notifications for the current user."""
    try:
        count = get_unread_count_service(db, current_user.id)
        logger.info(f"Fetching unread notification count for user {current_user.id}")

        return success_response(
            message="Unread notification count fetched successfully",
            data={"unread_count": count},
        )
    except Exception as e:
        logger.error(
            f"Error fetching unread count for user {current_user.id}", exc_info=e
        )
        return error_response(message="Failed to fetch unread count", status_code=500)


@router.post("/{notification_id}/read", response_model=ResponseModel)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Mark a specific notification as read."""
    try:
        mark_notification_read_service(db, notification_id, current_user.id)
        logger.info(
            f"Notification {notification_id} marked as read for user {current_user.id}"
        )

        return success_response(
            message="Notification marked as read",
            data={"success": True},
        )
    except Exception as e:
        logger.error(
            f"Error marking notification {notification_id} as read", exc_info=e
        )
        return error_response(
            message="Failed to mark notification as read", status_code=500
        )


@router.post("/read-all", response_model=ResponseModel)
def read_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Mark all notifications as read for the current user."""
    try:
        mark_all_notifications_read_service(db, current_user.id)
        logger.info(f"All notifications marked as read for user {current_user.id}")

        return success_response(
            message="All notifications marked as read",
            data={"success": True},
        )
    except Exception as e:
        logger.error(
            f"Error marking all notifications as read for user {current_user.id}",
            exc_info=e,
        )
        return error_response(
            message="Failed to mark all notifications as read", status_code=500
        )
