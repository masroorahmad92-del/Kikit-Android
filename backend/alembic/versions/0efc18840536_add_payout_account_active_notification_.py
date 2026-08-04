"""add_payout_account_active_notification_type

Revision ID: 0efc18840536
Revises: b3c4d5e6f7a8
Create Date: 2026-04-05 19:21:19.788255

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0efc18840536'
down_revision: Union[str, Sequence[str], None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'payout_account_active'")


def downgrade() -> None:
    # Postgres does not support removing enum values; a full type recreation would be needed.
    pass
