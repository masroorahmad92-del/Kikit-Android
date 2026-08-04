"""fix gift_transactions created_at timezone

Revision ID: 33398e5b9904
Revises: f1a2b3c4d5e6
Create Date: 2026-04-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "33398e5b9904"
down_revision: Union[str, None] = "aa1b2c3d4e56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert timestamp without timezone to timestamp with timezone (UTC)
    op.execute(
        "ALTER TABLE gift_transactions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'"
    )


def downgrade() -> None:
    # Revert back to timestamp without timezone
    op.execute(
        "ALTER TABLE gift_transactions ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC'"
    )
