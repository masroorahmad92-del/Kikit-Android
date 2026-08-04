"""remove revenuecat fields and table

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-04-05 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "is_premium")
    op.drop_column("users", "subscription_expires_at")
    op.drop_column("users", "subscription_product_id")
    op.drop_table("revenuecat_events")


def downgrade() -> None:
    op.create_table(
        "revenuecat_events",
        sa.Column("event_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("coins", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.add_column(
        "users",
        sa.Column(
            "subscription_product_id", sa.String(), nullable=True
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "subscription_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_premium",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
