"""add missing notification types: gift_received and message_received

Revision ID: add_missing_notification_types
Revises: ('a1b2c3d4e5f7', 'e6f7a8b9c0d1')
Create Date: 2026-04-19 00:00:00.000000

Merges the two migration branches back together.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'add_missing_notification_types'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f7', 'e6f7a8b9c0d1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'gift_received'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'message_received'")


def downgrade() -> None:
    # Postgres does not support removing enum values; a full type recreation would be needed.
    pass
