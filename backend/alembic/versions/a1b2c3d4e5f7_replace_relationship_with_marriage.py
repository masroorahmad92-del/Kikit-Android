"""replace relationship with marriage in looking_for

Revision ID: a1b2c3d4e5f7
Revises: 33398e5b9904
Create Date: 2026-04-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, None] = "33398e5b9904"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Replace 'relationship' with 'marriage' in looking_for array
    op.execute(
        """
        UPDATE profiles
        SET looking_for = array_replace(looking_for, 'relationship', 'marriage')
        WHERE 'relationship' = ANY(looking_for)
        """
    )


def downgrade() -> None:
    # Revert 'marriage' back to 'relationship'
    op.execute(
        """
        UPDATE profiles
        SET looking_for = array_replace(looking_for, 'marriage', 'relationship')
        WHERE 'marriage' = ANY(looking_for)
        """
    )
