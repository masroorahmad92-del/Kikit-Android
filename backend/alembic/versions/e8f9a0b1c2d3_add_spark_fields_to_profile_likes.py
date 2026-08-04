"""add spark fields to profile likes

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
Create Date: 2026-05-24 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "profile_likes",
        sa.Column(
            "spark_interest_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("interests.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "profile_likes",
        sa.Column(
            "spark_category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("interest_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "profile_likes",
        sa.Column("spark_question", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "profile_likes",
        sa.Column("spark_answer", sa.Text(), nullable=True),
    )
    op.add_column(
        "profile_likes",
        sa.Column(
            "spark_created_from",
            sa.String(length=50),
            nullable=False,
            server_default="discover",
        ),
    )


def downgrade() -> None:
    op.drop_column("profile_likes", "spark_created_from")
    op.drop_column("profile_likes", "spark_answer")
    op.drop_column("profile_likes", "spark_question")
    op.drop_column("profile_likes", "spark_category_id")
    op.drop_column("profile_likes", "spark_interest_id")
