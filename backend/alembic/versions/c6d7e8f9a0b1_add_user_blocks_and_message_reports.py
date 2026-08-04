"""add user blocks and message reports

Revision ID: c6d7e8f9a0b1
Revises: b0c78d7dee60
Create Date: 2026-05-09 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c6d7e8f9a0b1"
down_revision: Union[str, Sequence[str], None] = "b0c78d7dee60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_blocks",
        sa.Column("blocker_id", sa.UUID(), nullable=False),
        sa.Column("blocked_user_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            comment="Indicates whether this record is active or disabled.",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["blocked_user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["blocker_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
        sa.UniqueConstraint(
            "blocker_id",
            "blocked_user_id",
            name="uq_user_blocks_blocker_blocked",
        ),
    )
    op.create_index(
        op.f("ix_user_blocks_blocked_user_id"),
        "user_blocks",
        ["blocked_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_blocks_blocker_id"),
        "user_blocks",
        ["blocker_id"],
        unique=False,
    )

    op.add_column(
        "user_reports",
        sa.Column(
            "report_type",
            sa.String(length=20),
            nullable=False,
            server_default="USER",
        ),
    )
    op.add_column(
        "user_reports",
        sa.Column("message_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "user_reports",
        sa.Column("channel_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "user_reports",
        sa.Column("message_text", sa.Text(), nullable=True),
    )
    op.create_index(
        op.f("ix_user_reports_report_type"),
        "user_reports",
        ["report_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_reports_message_id"),
        "user_reports",
        ["message_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_reports_channel_id"),
        "user_reports",
        ["channel_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_reports_channel_id"), table_name="user_reports")
    op.drop_index(op.f("ix_user_reports_message_id"), table_name="user_reports")
    op.drop_index(op.f("ix_user_reports_report_type"), table_name="user_reports")
    op.drop_column("user_reports", "message_text")
    op.drop_column("user_reports", "channel_id")
    op.drop_column("user_reports", "message_id")
    op.drop_column("user_reports", "report_type")

    op.drop_index(op.f("ix_user_blocks_blocker_id"), table_name="user_blocks")
    op.drop_index(op.f("ix_user_blocks_blocked_user_id"), table_name="user_blocks")
    op.drop_table("user_blocks")
