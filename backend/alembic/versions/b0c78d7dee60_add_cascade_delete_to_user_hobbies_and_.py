"""add cascade delete to user_hobbies and user_interests profile_id fk

Revision ID: b0c78d7dee60
Revises: normalize_dob_format
Create Date: 2026-04-19 20:28:07.456579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b0c78d7dee60'
down_revision: Union[str, Sequence[str], None] = 'normalize_dob_format'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('user_hobbies_profile_id_fkey', 'user_hobbies', type_='foreignkey')
    op.create_foreign_key('user_hobbies_profile_id_fkey', 'user_hobbies', 'profiles', ['profile_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('user_interests_profile_id_fkey', 'user_interests', type_='foreignkey')
    op.create_foreign_key('user_interests_profile_id_fkey', 'user_interests', 'profiles', ['profile_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint('user_interests_profile_id_fkey', 'user_interests', type_='foreignkey')
    op.create_foreign_key('user_interests_profile_id_fkey', 'user_interests', 'profiles', ['profile_id'], ['id'])
    op.drop_constraint('user_hobbies_profile_id_fkey', 'user_hobbies', type_='foreignkey')
    op.create_foreign_key('user_hobbies_profile_id_fkey', 'user_hobbies', 'profiles', ['profile_id'], ['id'])
