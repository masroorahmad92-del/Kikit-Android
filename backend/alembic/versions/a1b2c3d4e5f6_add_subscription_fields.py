"""add subscription fields to users and make revenuecat_events coins nullable

Revision ID: a1b2c3d4e5f6
Revises: 4f39fd63f74c
Create Date: 2026-03-15 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "4f39fd63f74c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_premium", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "users",
        sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("subscription_product_id", sa.String(), nullable=True),
    )
    op.alter_column(
        "revenuecat_events",
        "coins",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "revenuecat_events",
        "coins",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.drop_column("users", "subscription_product_id")
    op.drop_column("users", "subscription_expires_at")
    op.drop_column("users", "is_premium")
