"""seed hobbies and interests

Revision ID: 77d61de24f32
Revises: 1051655e137b
Create Date: 2025-10-12 15:15:37.446811

"""

from datetime import datetime, timezone
from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "77d61de24f32"
down_revision: Union[str, Sequence[str], None] = "1051655e137b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    now = datetime.now(timezone.utc)

    # === Insert Hobby Categories ===
    hobby_categories = [
        {"id": uuid4(), "name": "Arts & Crafts"},
        {"id": uuid4(), "name": "Music & Performance"},
    ]

    for cat in hobby_categories:
        conn.execute(
            sa.text(
                """
            INSERT INTO hobby_categories (id, name, is_active, created_at, updated_at)
            VALUES (:id, :name, true, :created_at, :updated_at)
        """
            ),
            {
                "id": cat["id"],
                "name": cat["name"],
                "created_at": now,
                "updated_at": now,
            },
        )

    # === Insert Hobbies ===
    hobby_data = {
        "Arts & Crafts": [
            "Painting",
            "Sculpting",
            "Knitting",
            "Woodworking",
            "DIY Projects",
        ],
        "Music & Performance": [
            "Singing",
            "Dancing",
            "Playing Guitar",
            "Acting",
            "Public Speaking",
        ],
    }

    for category in hobby_categories:
        for hobby in hobby_data[category["name"]]:
            conn.execute(
                sa.text(
                    """
                INSERT INTO hobbies (id, name, category_id, is_active, created_at, updated_at)
                VALUES (:id, :name, :category_id, true, :created_at, :updated_at)
            """
                ),
                {
                    "id": uuid4(),
                    "name": hobby,
                    "category_id": category["id"],
                    "created_at": now,
                    "updated_at": now,
                },
            )

    # === Insert Interest Categories ===
    interest_categories = [
        {"id": uuid4(), "name": "Travel"},
        {"id": uuid4(), "name": "Sports"},
        {"id": uuid4(), "name": "Music"},
    ]

    for cat in interest_categories:
        conn.execute(
            sa.text(
                """
            INSERT INTO interest_categories (id, name, is_active, created_at, updated_at)
            VALUES (:id, :name, true, :created_at, :updated_at)
        """
            ),
            {
                "id": cat["id"],
                "name": cat["name"],
                "created_at": now,
                "updated_at": now,
            },
        )

    # === Insert Interests ===
    interest_data = {
        "Travel": [
            "Beach Getaways",
            "Mountain Retreats",
            "Historical Sites",
            "Van Life",
            "Road Trip",
            "Hiking",
            "Camping",
            "City Trip",
            "Staycation",
            "Tropical Islands",
        ],
        "Sports": [
            "Soccer",
            "Basketball",
            "Tennis",
            "Swimming",
            "Cycling",
            "Running",
            "Baseball",
            "Volleyball",
            "Golf",
            "Skiing",
        ],
        "Music": [
            "Listening to Music",
            "Playing Instruments",
            "Attending Concerts",
            "Composing",
            "DJing",
            "Music Production",
            "Singing",
            "Collecting Vinyl",
            "Music Theory",
            "Band Practice",
        ],
    }

    for category in interest_categories:
        for interest in interest_data[category["name"]]:
            conn.execute(
                sa.text(
                    """
                INSERT INTO interests (id, name, category_id, is_active, created_at, updated_at)
                VALUES (:id, :name, :category_id, true, :created_at, :updated_at)
            """
                ),
                {
                    "id": uuid4(),
                    "name": interest,
                    "category_id": category["id"],
                    "created_at": now,
                    "updated_at": now,
                },
            )


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text("DELETE FROM hobbies"))
    conn.execute(sa.text("DELETE FROM hobby_categories"))
    conn.execute(sa.text("DELETE FROM interests"))
    conn.execute(sa.text("DELETE FROM interest_categories"))
