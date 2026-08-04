"""add location field to profiles table

Revision ID: b377f7f73eba
Revises: 08789e63eecd
Create Date: 2026-01-30 10:48:13.338350
"""

from typing import Sequence, Union
from alembic import op
import geoalchemy2
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b377f7f73eba"
down_revision: Union[str, Sequence[str], None] = "08789e63eecd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add location column
    op.add_column(
        "profiles",
        sa.Column(
            "location",
            geoalchemy2.types.Geography(
                geometry_type="POINT",
                srid=4326,
                dimension=2,
                from_text="ST_GeogFromText",
                name="geography",
            ),
            nullable=True,
            comment="User location as geographic point",
        ),
    )

    # Create GiST index only if it doesn't exist
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'idx_profiles_location'
            ) THEN
                CREATE INDEX idx_profiles_location
                ON profiles USING gist (location);
            END IF;
        END
        $$;
        """
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index safely if exists
    op.drop_index("idx_profiles_location", table_name="profiles", if_exists=True)

    # Drop location column
    op.drop_column("profiles", "location")

    # DO NOT touch spatial_ref_sys — it's PostGIS internal!
