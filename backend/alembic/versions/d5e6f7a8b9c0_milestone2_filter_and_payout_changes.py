"""milestone2: filter multi-select columns

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-04-07 00:00:00.000000

Changes:
- user_preferences.looking_for: Enum → ARRAY(String)
- user_preferences.ethnicity: String(50) → ARRAY(String)
- user_preferences.country: String(100) → ARRAY(String)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── user_preferences: looking_for Enum → ARRAY(String) ──────────────────
    op.drop_column("user_preferences", "looking_for")
    op.add_column(
        "user_preferences",
        sa.Column("looking_for", postgresql.ARRAY(sa.String()), nullable=True),
    )

    # ── user_preferences: ethnicity String → ARRAY(String) ──────────────────
    op.drop_column("user_preferences", "ethnicity")
    op.add_column(
        "user_preferences",
        sa.Column("ethnicity", postgresql.ARRAY(sa.String()), nullable=True),
    )

    # ── user_preferences: country String → ARRAY(String) ────────────────────
    op.drop_column("user_preferences", "country")
    op.add_column(
        "user_preferences",
        sa.Column("country", postgresql.ARRAY(sa.String()), nullable=True),
    )

def downgrade() -> None:
    # ── user_preferences: country ARRAY → String ────────────────────────────
    op.drop_column("user_preferences", "country")
    op.add_column(
        "user_preferences",
        sa.Column("country", sa.String(100), nullable=True),
    )

    # ── user_preferences: ethnicity ARRAY → String ──────────────────────────
    op.drop_column("user_preferences", "ethnicity")
    op.add_column(
        "user_preferences",
        sa.Column("ethnicity", sa.String(50), nullable=True),
    )

    # ── user_preferences: looking_for ARRAY → Enum ──────────────────────────
    op.drop_column("user_preferences", "looking_for")
    op.add_column(
        "user_preferences",
        sa.Column(
            "looking_for",
            sa.Enum("DATING", "FRIENDSHIP", "RELATIONSHIP", name="lookingforenum"),
            nullable=True,
        ),
    )
