"""add scheduled payout status

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-04-07 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, Sequence[str], None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE payout_status_enum ADD VALUE IF NOT EXISTS 'scheduled'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; a full type recreation is required.
    # This is intentionally left as a no-op — remove the value manually if needed.
    pass
