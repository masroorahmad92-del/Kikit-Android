"""add live rooms

Revision ID: f9a0b1c2d3e4
Revises: e8f9a0b1c2d3
Create Date: 2026-06-14 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f9a0b1c2d3e4"
down_revision: Union[str, Sequence[str], None] = "e8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


live_room_status_enum = postgresql.ENUM(
    "scheduled",
    "live",
    "ended",
    "cancelled",
    name="live_room_status_enum",
    create_type=False,
)
live_room_member_role_enum = postgresql.ENUM(
    "host",
    "viewer",
    "moderator",
    name="live_room_member_role_enum",
    create_type=False,
)


def upgrade() -> None:
    live_room_status_enum.create(op.get_bind(), checkfirst=True)
    live_room_member_role_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "live_rooms",
        sa.Column("host_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("host_profile_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            live_room_status_enum,
            server_default="scheduled",
            nullable=False,
        ),
        sa.Column("stream_call_id", sa.String(length=120), nullable=False),
        sa.Column("stream_chat_channel_id", sa.String(length=120), nullable=False),
        sa.Column("viewer_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("gift_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["interest_categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["host_profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["host_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
        sa.UniqueConstraint("stream_call_id"),
        sa.UniqueConstraint("stream_chat_channel_id"),
    )
    op.create_index(op.f("ix_live_rooms_category_id"), "live_rooms", ["category_id"])
    op.create_index(op.f("ix_live_rooms_host_profile_id"), "live_rooms", ["host_profile_id"])
    op.create_index(op.f("ix_live_rooms_host_user_id"), "live_rooms", ["host_user_id"])
    op.create_index(op.f("ix_live_rooms_status"), "live_rooms", ["status"])

    op.create_table(
        "live_room_members",
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "role",
            live_room_member_role_enum,
            server_default="viewer",
            nullable=False,
        ),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["live_rooms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
        sa.UniqueConstraint("room_id", "user_id", name="uq_live_room_member_room_user"),
    )
    op.create_index(op.f("ix_live_room_members_room_id"), "live_room_members", ["room_id"])
    op.create_index(op.f("ix_live_room_members_user_id"), "live_room_members", ["user_id"])

    op.add_column(
        "gift_transactions",
        sa.Column("live_room_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_gift_transactions_live_room_id_live_rooms",
        "gift_transactions",
        "live_rooms",
        ["live_room_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_gift_transactions_live_room_id"),
        "gift_transactions",
        ["live_room_id"],
    )

    op.add_column(
        "user_reports",
        sa.Column("live_room_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_user_reports_live_room_id_live_rooms",
        "user_reports",
        "live_rooms",
        ["live_room_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_user_reports_live_room_id"), "user_reports", ["live_room_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_user_reports_live_room_id"), table_name="user_reports")
    op.drop_constraint(
        "fk_user_reports_live_room_id_live_rooms", "user_reports", type_="foreignkey"
    )
    op.drop_column("user_reports", "live_room_id")

    op.drop_index(op.f("ix_gift_transactions_live_room_id"), table_name="gift_transactions")
    op.drop_constraint(
        "fk_gift_transactions_live_room_id_live_rooms",
        "gift_transactions",
        type_="foreignkey",
    )
    op.drop_column("gift_transactions", "live_room_id")

    op.drop_index(op.f("ix_live_room_members_user_id"), table_name="live_room_members")
    op.drop_index(op.f("ix_live_room_members_room_id"), table_name="live_room_members")
    op.drop_table("live_room_members")

    op.drop_index(op.f("ix_live_rooms_status"), table_name="live_rooms")
    op.drop_index(op.f("ix_live_rooms_host_user_id"), table_name="live_rooms")
    op.drop_index(op.f("ix_live_rooms_host_profile_id"), table_name="live_rooms")
    op.drop_index(op.f("ix_live_rooms_category_id"), table_name="live_rooms")
    op.drop_table("live_rooms")

    live_room_member_role_enum.drop(op.get_bind(), checkfirst=True)
    live_room_status_enum.drop(op.get_bind(), checkfirst=True)
