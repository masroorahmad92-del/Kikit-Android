from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user_report import UserReport
from app.schemas.user_report import MessageReportCreate, ReportCreate


def create_report(db: Session, reporter_id: UUID, data: ReportCreate) -> UserReport:
    """Create a user report."""
    report = UserReport(
        reporter_id=reporter_id,
        reported_user_id=data.reported_user_id,
        reason=data.reason,
        description=data.description,
        report_type="USER",
        live_room_id=data.live_room_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def create_message_report(
    db: Session, reporter_id: UUID, data: MessageReportCreate
) -> UserReport:
    """Create a report for a specific chat message."""
    report = UserReport(
        reporter_id=reporter_id,
        reported_user_id=data.reported_user_id,
        reason=data.reason,
        description=data.description,
        report_type="MESSAGE",
        message_id=data.message_id,
        channel_id=data.channel_id,
        message_text=data.message_text,
        live_room_id=data.live_room_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
