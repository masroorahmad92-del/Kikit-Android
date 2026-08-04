"""normalize dob date format to DD-MM-YYYY

Revision ID: normalize_dob_format
Revises: a1b2c3d4e5f7
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "normalize_dob_format"
down_revision: Union[str, None] = "add_missing_notification_types"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert dates from MM/DD/YYYY or YYYY-MM-DD to DD-MM-YYYY format
    op.execute(
        """
        UPDATE profiles
        SET dob = (
            CASE
                WHEN dob ~ '^\\d{2}/\\d{2}/\\d{4}$' THEN
                    -- For dates with '/', swap MM/DD to DD-MM and replace / with -
                    (string_to_array(dob, '/'))[3] || '-' ||
                    (string_to_array(dob, '/'))[1] || '-' ||
                    (string_to_array(dob, '/'))[2]
                WHEN dob ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN
                    -- For dates in YYYY-MM-DD format, rearrange to DD-MM-YYYY
                    (string_to_array(dob, '-'))[3] || '-' ||
                    (string_to_array(dob, '-'))[2] || '-' ||
                    (string_to_array(dob, '-'))[1]
                ELSE
                    -- Keep dates that are already in correct format (DD-MM-YYYY with -)
                    dob
            END
        )
        WHERE dob IS NOT NULL AND (dob ~ '^\\d{2}/\\d{2}/\\d{4}$' OR dob ~ '^\\d{4}-\\d{2}-\\d{2}$')
        """
    )


def downgrade() -> None:
    # Revert back to MM/DD/YYYY if needed
    op.execute(
        """
        UPDATE profiles
        SET dob = (
            CASE
                WHEN dob ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN
                    -- For dates with '-', swap DD-MM back to MM/DD and replace - with /
                    (string_to_array(dob, '-'))[2] || '/' ||
                    (string_to_array(dob, '-'))[1] || '/' ||
                    (string_to_array(dob, '-'))[3]
                ELSE
                    -- Keep dates that are already in correct format
                    dob
            END
        )
        WHERE dob IS NOT NULL AND dob ~ '^\\d{2}-\\d{2}-\\d{4}$'
        """
    )
