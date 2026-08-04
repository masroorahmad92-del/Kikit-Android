"""add performance indexes on transactions, announcements, notifications, devices

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-03-15 14:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # coin_transactions.user_id — used by transaction history per user
    op.create_index("ix_coin_transactions_user_id", "coin_transactions", ["user_id"])

    # diamond_transactions.user_id — used by diamond history per user
    op.create_index(
        "ix_diamond_transactions_user_id", "diamond_transactions", ["user_id"]
    )

    # gift_transactions.sender_id / receiver_id — used by sent/received gift history
    op.create_index(
        "ix_gift_transactions_sender_id", "gift_transactions", ["sender_id"]
    )
    op.create_index(
        "ix_gift_transactions_receiver_id", "gift_transactions", ["receiver_id"]
    )

    # announcements.sender_id / receiver_id — used by announcement queries
    op.create_index("ix_announcements_sender_id", "announcements", ["sender_id"])
    op.create_index("ix_announcements_receiver_id", "announcements", ["receiver_id"])

    # notifications.(user_id, is_read) composite — used by unread count and mark-all-read
    op.create_index(
        "ix_notifications_user_id_is_read",
        "notifications",
        ["user_id", "is_read"],
    )

    # devices.fcm_token — used by create_or_update_device lookup
    op.create_index("ix_devices_fcm_token", "devices", ["fcm_token"])


def downgrade() -> None:
    op.drop_index("ix_devices_fcm_token", table_name="devices")
    op.drop_index("ix_notifications_user_id_is_read", table_name="notifications")
    op.drop_index("ix_announcements_receiver_id", table_name="announcements")
    op.drop_index("ix_announcements_sender_id", table_name="announcements")
    op.drop_index("ix_gift_transactions_receiver_id", table_name="gift_transactions")
    op.drop_index("ix_gift_transactions_sender_id", table_name="gift_transactions")
    op.drop_index("ix_diamond_transactions_user_id", table_name="diamond_transactions")
    op.drop_index("ix_coin_transactions_user_id", table_name="coin_transactions")
