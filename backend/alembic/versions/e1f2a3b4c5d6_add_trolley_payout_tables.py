"""add trolley payout tables

Revision ID: e1f2a3b4c5d6
Revises: d1e2f3a4b5c6
Create Date: 2026-03-15 16:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # trolley_recipient_id on users
    op.add_column(
        "users",
        sa.Column(
            "trolley_recipient_id",
            sa.String(),
            nullable=True,
            comment="Trolley payout recipient ID (e.g. R-xxxxx). Null until the user registers their payout account.",
        ),
    )

    # payout_requests table
    op.create_table(
        "payout_requests",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("diamonds_redeemed", sa.Integer(), nullable=False),
        sa.Column("amount_usd", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "processing",
                "completed",
                "failed",
                name="payout_status_enum",
                create_type=False,
            ),
            nullable=False,
            server_default="processing",
        ),
        sa.Column("trolley_batch_id", sa.String(), nullable=True),
        sa.Column("trolley_payment_id", sa.String(), nullable=True),
        sa.Column("failure_reason", sa.String(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
            comment="Indicates whether this record is active or disabled.",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )

    op.create_index(
        "ix_payout_requests_user_id",
        "payout_requests",
        ["user_id"],
    )
    op.create_index(
        "ix_payout_requests_trolley_payment_id",
        "payout_requests",
        ["trolley_payment_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_payout_requests_trolley_payment_id", table_name="payout_requests")
    op.drop_index("ix_payout_requests_user_id", table_name="payout_requests")
    op.drop_table("payout_requests")
    op.drop_column("users", "trolley_recipient_id")
    op.execute("DROP TYPE payout_status_enum")
