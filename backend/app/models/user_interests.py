from sqlalchemy import Column, ForeignKey, Table

from app.database.base import BaseModel

user_interests = Table(
    "user_interests",
    BaseModel.metadata,
    Column("profile_id", ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("interest_id", ForeignKey("interests.id"), primary_key=True),
)
