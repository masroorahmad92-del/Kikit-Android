from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import BaseModel


class Gift(BaseModel):
    __tablename__ = "gifts"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    icon: Mapped[str] = mapped_column(String(255), nullable=True)
    coin_cost: Mapped[int] = mapped_column(Integer)
    diamond_cost: Mapped[int] = mapped_column(Integer, server_default="0", default=0)
