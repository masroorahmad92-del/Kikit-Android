"""convert_looking_for_to_array_and_remove_distance

Revision ID: aa1b2c3d4e56
Revises: e6f7a8b9c0d1
Create Date: 2026-04-11

Convert Profile.looking_for from single enum to ARRAY(String) for multi-select support.
Remove UserPreferences.distance_km (replaced by country filter).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa1b2c3d4e56"
down_revision: Union[str, None] = "e6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Convert profiles.looking_for from enum to ARRAY(String) ──────────
    # Migrate existing single enum value into a single-element array.
    op.execute(
        """
        ALTER TABLE profiles
        ALTER COLUMN looking_for TYPE VARCHAR(50)[]
        USING CASE
            WHEN looking_for IS NOT NULL THEN ARRAY[looking_for::text]
            ELSE '{}'
        END
        """
    )

    # Drop the old enum constraint/type if it exists
    op.execute(
        """
        ALTER TABLE profiles
        ALTER COLUMN looking_for SET DEFAULT '{}'
        """
    )

    # ── 2. Remove user_preferences.distance_km ─────────────────────────────
    op.drop_column("user_preferences", "distance_km")


def downgrade() -> None:
    # ── 1. Restore user_preferences.distance_km ─────────────────────────────
    op.add_column(
        "user_preferences",
        sa.Column("distance_km", sa.Integer(), nullable=False, server_default="30"),
    )

    # ── 2. Revert profiles.looking_for back to single enum ──────────────────
    # Take the first element from the array (or default to 'dating')
    op.execute(
        """
        ALTER TABLE profiles
        ALTER COLUMN looking_for TYPE looking_for_enum
        USING CASE
            WHEN array_length(looking_for, 1) > 0 THEN looking_for[1]::looking_for_enum
            ELSE 'dating'::looking_for_enum
        END
        """
    )

    op.execute(
        """
        ALTER TABLE profiles
        ALTER COLUMN looking_for SET DEFAULT 'dating'
        """
    )
