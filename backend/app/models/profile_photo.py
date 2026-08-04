from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.models.profile import Profile


class ProfilePhoto(BaseModel):
    __tablename__ = "profile_photos"

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE")
    )
    public_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        comment="Cloudinary public ID for this image",
    )
    url: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
        comment="Direct Cloudinary URL for displaying the image",
    )
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Original filename of the uploaded profile photo",
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="photos")
