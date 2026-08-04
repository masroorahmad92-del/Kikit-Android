"""add country to user_preferences

Revision ID: c4d5e6f7a8b9
Revises: 0efc18840536
Create Date: 2026-04-07 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "0efc18840536"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_preferences",
        sa.Column("country", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_preferences", "country")
