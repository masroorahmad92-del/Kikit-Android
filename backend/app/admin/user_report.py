# app/admin.py
from sqladmin import ModelView

from app.models.user_report import UserReport


class UserReportAdmin(ModelView, model=UserReport):  # type: ignore[call-arg]
    column_list = [
        UserReport.id,
        UserReport.reporter_id,
        UserReport.reported_user_id,
        UserReport.report_type,
        UserReport.reason,
        UserReport.status,
        UserReport.message_id,
        UserReport.channel_id,
        UserReport.created_at,
    ]

    column_searchable_list = [
        "reporter_id",
        "reported_user_id",
        "message_id",
        "channel_id",
    ]

    form_columns = [
        "status",
        "description",
        "reason",
        "report_type",
        "message_id",
        "channel_id",
        "message_text",
        "reporter_id",
        "reported_user_id",
    ]

    column_labels = {
        UserReport.id: "Report ID",
        UserReport.reporter_id: "Reporter (User ID)",
        UserReport.reported_user_id: "Reported (User ID)",
        UserReport.report_type: "Report Type",
        UserReport.reason: "Reason Category",
        UserReport.description: "Details/Message",
        UserReport.message_id: "Message ID",
        UserReport.channel_id: "Channel ID",
        UserReport.message_text: "Message Text Snapshot",
        UserReport.status: "Moderation Status",
        UserReport.created_at: "Reported Date",
    }

    column_default_sort = [(UserReport.created_at, True)]

    name = "User Report"
    name_plural = "User Reports"
    icon = "fa-solid fa-flag"
