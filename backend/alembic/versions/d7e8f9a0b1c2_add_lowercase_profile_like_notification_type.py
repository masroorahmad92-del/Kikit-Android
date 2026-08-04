"""add lowercase profile_like notification type

Revision ID: d7e8f9a0b1c2
Revises: c6d7e8f9a0b1
Create Date: 2026-05-11 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, Sequence[str], None] = "c6d7e8f9a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'profile_like'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
