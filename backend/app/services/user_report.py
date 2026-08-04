from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user_report import UserReport
from app.repositories.user import get_user_by_id
from app.repositories.user_report import create_message_report, create_report
from app.schemas.user_report import MessageReportCreate, ReportCreate


def _validate_report_target(db: Session, reporter_id: UUID, reported_user_id: UUID):
    if reporter_id == reported_user_id:
        raise ValueError("You cannot report yourself")

    if not get_user_by_id(db, reported_user_id):
        raise LookupError("Reported user not found")


def create_user_report(
    db: Session, reporter_id: UUID, data: ReportCreate
) -> UserReport:
    """Create a user report."""
    _validate_report_target(db, reporter_id, data.reported_user_id)
    return create_report(db, reporter_id, data)


def create_user_message_report(
    db: Session, reporter_id: UUID, data: MessageReportCreate
) -> UserReport:
    """Create a report for a specific chat message."""
    _validate_report_target(db, reporter_id, data.reported_user_id)
    return create_message_report(db, reporter_id, data)
