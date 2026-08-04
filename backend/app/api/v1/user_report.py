from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.enums import ReportReason
from app.core.logger import logger
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.response import ResponseModel
from app.schemas.user_report import MessageReportCreate, ReportCreate
from app.services.user_report import create_user_message_report, create_user_report
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/report", tags=["User Reports"])


@router.post("", response_model=ResponseModel)
def report_user(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        create_user_report(db, current_user.id, payload)

        logger.info(f"User {current_user.id} reported user {payload.reported_user_id}")

        return success_response(
            message="Report submitted successfully. We will review it shortly.",
            data={"status": "submitted"},
        )
    except ValueError as e:
        return error_response(message=str(e), status_code=400)
    except LookupError as e:
        return error_response(message=str(e), status_code=404)
    except Exception as e:
        logger.error("Failed to submit report", exc_info=e)
        return error_response(message="Failed to submit report", status_code=500)


@router.post("/message", response_model=ResponseModel)
def report_message(
    payload: MessageReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        create_user_message_report(db, current_user.id, payload)

        logger.info(
            "User %s reported message %s from user %s",
            current_user.id,
            payload.message_id,
            payload.reported_user_id,
        )

        return success_response(
            message="Message report submitted successfully. We will review it shortly.",
            data={"status": "submitted"},
        )
    except ValueError as e:
        return error_response(message=str(e), status_code=400)
    except LookupError as e:
        return error_response(message=str(e), status_code=404)
    except Exception as e:
        logger.error("Failed to submit message report", exc_info=e)
        return error_response(
            message="Failed to submit message report", status_code=500
        )


@router.get("/reasons", response_model=ResponseModel)
def get_report_reasons(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Returns a list of valid reasons for reporting a user.
    Used to populate the dropdown in the UI.
    """
    try:
        # Get all members of the Enum
        reasons = [
            {"id": reason.name, "label": reason.value.replace("_", " ").title()}
            for reason in ReportReason
        ]

        return success_response(
            message="Report reasons fetched successfully", data={"reasons": reasons}
        )
    except Exception as e:
        logger.error(f"Error fetching report reasons: {str(e)}")
        return error_response(message="Failed to load reasons", status_code=500)
