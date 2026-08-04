from sqlalchemy import Column, ForeignKey, Table

from app.database.base import BaseModel

user_hobbies = Table(
    "user_hobbies",
    BaseModel.metadata,
    Column("profile_id", ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("hobby_id", ForeignKey("hobbies.id"), primary_key=True),
)
