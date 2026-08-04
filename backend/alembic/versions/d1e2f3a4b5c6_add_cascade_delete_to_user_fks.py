"""add cascade delete to user foreign keys

Revision ID: d1e2f3a4b5c6
Revises: c1d2e3f4a5b6
Create Date: 2026-03-24 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Each entry: (table, fk_constraint_name, column(s), ref_table, ref_col)
_FK_CHANGES = [
    (
        "coin_transactions",
        "coin_transactions_user_id_fkey",
        ["user_id"],
        "users",
        ["id"],
    ),
    (
        "diamond_transactions",
        "diamond_transactions_user_id_fkey",
        ["user_id"],
        "users",
        ["id"],
    ),
    (
        "devices",
        "devices_user_id_fkey",
        ["user_id"],
        "users",
        ["id"],
    ),
    (
        "notifications",
        "notifications_user_id_fkey",
        ["user_id"],
        "users",
        ["id"],
    ),
    (
        "revenuecat_events",
        "revenuecat_events_user_id_fkey",
        ["user_id"],
        "users",
        ["id"],
    ),
    (
        "gift_transactions",
        "gift_transactions_sender_id_fkey",
        ["sender_id"],
        "users",
        ["id"],
    ),
    (
        "gift_transactions",
        "gift_transactions_receiver_id_fkey",
        ["receiver_id"],
        "users",
        ["id"],
    ),
    (
        "announcements",
        "announcements_sender_id_fkey",
        ["sender_id"],
        "users",
        ["id"],
    ),
    (
        "announcements",
        "announcements_receiver_id_fkey",
        ["receiver_id"],
        "users",
        ["id"],
    ),
    (
        "user_reports",
        "user_reports_reporter_id_fkey",
        ["reporter_id"],
        "users",
        ["id"],
    ),
    (
        "user_reports",
        "user_reports_reported_user_id_fkey",
        ["reported_user_id"],
        "users",
        ["id"],
    ),
]


def upgrade() -> None:
    for table, constraint, cols, ref_table, ref_cols in _FK_CHANGES:
        op.drop_constraint(constraint, table, type_="foreignkey")
        op.create_foreign_key(
            constraint,
            table,
            ref_table,
            cols,
            ref_cols,
            ondelete="CASCADE",
        )


def downgrade() -> None:
    for table, constraint, cols, ref_table, ref_cols in _FK_CHANGES:
        op.drop_constraint(constraint, table, type_="foreignkey")
        op.create_foreign_key(
            constraint,
            table,
            ref_table,
            cols,
            ref_cols,
        )
