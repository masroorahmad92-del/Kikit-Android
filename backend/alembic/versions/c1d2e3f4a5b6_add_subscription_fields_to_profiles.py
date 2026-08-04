"""add subscription fields to profiles table

Revision ID: c1d2e3f4a5b6
Revises: b7c8d9e0f1a2
Create Date: 2026-03-15 15:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE subscription_type_enum AS ENUM ('monthly', 'yearly')")

    op.add_column(
        "profiles",
        sa.Column(
            "subscription_type",
            sa.Enum("monthly", "yearly", name="subscription_type_enum"),
            nullable=True,
            comment="Subscription plan: monthly or yearly. None means no active subscription.",
        ),
    )
    op.add_column(
        "profiles",
        sa.Column(
            "subscription_start_date",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="When the current subscription period started.",
        ),
    )
    op.add_column(
        "profiles",
        sa.Column(
            "subscription_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="When the current subscription period expires.",
        ),
    )
    op.add_column(
        "profiles",
        sa.Column(
            "calls_taken",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Number of calls used in the current subscription period. Resets on renewal.",
        ),
    )


def downgrade() -> None:
    op.drop_column("profiles", "calls_taken")
    op.drop_column("profiles", "subscription_expires_at")
    op.drop_column("profiles", "subscription_start_date")
    op.drop_column("profiles", "subscription_type")
    op.execute("DROP TYPE subscription_type_enum")
