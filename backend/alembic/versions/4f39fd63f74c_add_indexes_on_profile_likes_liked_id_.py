"""add indexes on profile_likes liked_id device user_id otp recipient

Revision ID: 4f39fd63f74c
Revises: c39c9a56cfc9
Create Date: 2026-03-15 06:30:32.383324

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '4f39fd63f74c'
down_revision: Union[str, Sequence[str], None] = 'c39c9a56cfc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # profile_likes.liked_id — used by get_users_who_liked_profile, get_ignored_likers
    op.create_index("ix_profile_likes_liked_id", "profile_likes", ["liked_id"])

    # profile_likes.is_ignored — frequently filtered in like queries
    op.create_index("ix_profile_likes_is_ignored", "profile_likes", ["is_ignored"])

    # devices.user_id — used by send_to_user on every push notification
    op.create_index("ix_devices_user_id", "devices", ["user_id"])

    # otp.recipient + source — composite used on every OTP lookup and invalidation
    op.create_index("ix_otp_recipient_source", "otp", ["recipient", "source"])


def downgrade() -> None:
    op.drop_index("ix_otp_recipient_source", table_name="otp")
    op.drop_index("ix_devices_user_id", table_name="devices")
    op.drop_index("ix_profile_likes_is_ignored", table_name="profile_likes")
    op.drop_index("ix_profile_likes_liked_id", table_name="profile_likes")
