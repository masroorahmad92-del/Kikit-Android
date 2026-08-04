from datetime import datetime
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import (
    CurrentStatusEnum,
    EthnicityEnum,
    GenderEnum,
    InterestedInEnum,
    ProfileReviewStatus,
    SubscriptionType,
)
from app.database.base import BaseModel
from app.models.user_hobbies import user_hobbies
from app.models.user_interests import user_interests

if TYPE_CHECKING:
    from app.models.hobby import Hobby
    from app.models.interest import Interest
    from app.models.profile_likes import ProfileLike
    from app.models.profile_photo import ProfilePhoto
    from app.models.user import User


class Profile(BaseModel):
    __tablename__ = "profiles"

    # --- Relation with User ---
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    user: Mapped["User"] = relationship("User", back_populates="profile")

    name: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Full name of the user"
    )
    dob: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="Date of birth in DD-MM-YYYY format"
    )
    country: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="Country of residence"
    )
    city: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="City of residence"
    )
    state: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="State of residence"
    )
    gender: Mapped[GenderEnum] = mapped_column(
        Enum(GenderEnum, name="gender_enum"),
        nullable=True,
        comment="Gender of the user",
    )
    country_code: Mapped[str] = mapped_column(
        String(10), nullable=True, comment="Country code for the phone number"
    )
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=True)
    looking_for: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="What the user is looking for (multi-select: dating, friendship, relationship)",
    )
    interested_in: Mapped[InterestedInEnum] = mapped_column(
        Enum(InterestedInEnum, name="interested_in_enum"),
        nullable=True,
        comment="Who the user wants to meet (men or women)",
    )
    height: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="Height of the user in cm or ft"
    )
    current_status: Mapped[CurrentStatusEnum] = mapped_column(
        Enum(CurrentStatusEnum, name="current_status_enum"),
        nullable=True,
        comment="Current relationship status",
    )
    ethnicity: Mapped[EthnicityEnum] = mapped_column(
        Enum(EthnicityEnum, name="ethnicity_enum"),
        nullable=True,
        comment="Ethnicity of the user",
    )
    interests: Mapped[list["Interest"]] = relationship(
        "Interest", secondary=user_interests, back_populates="users"
    )
    hobbies: Mapped[list["Hobby"]] = relationship(
        "Hobby", secondary=user_hobbies, back_populates="users"
    )
    about: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="User's self description or about me section"
    )
    photos: Mapped[list["ProfilePhoto"]] = relationship(
        "ProfilePhoto", back_populates="profile", cascade="all, delete-orphan"
    )
    location_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether the user has enabled location-based matching",
    )
    latitude: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="Latitude of user's current location"
    )
    longitude: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="Longitude of user's current location"
    )
    location: Mapped[object | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=True,
        comment="User location as geographic point",
    )
    acknowledged_terms: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether the user has accepted terms and continued from the acknowledge screen",
    )
    review_status: Mapped[ProfileReviewStatus] = mapped_column(
        Enum(ProfileReviewStatus),
        default=ProfileReviewStatus.pending,
        nullable=False,
        comment="Profile review status (pending, approved, rejected)",
    )
    is_phone_number_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Indicates whether the user's phone number has been verified",
    )
    is_profile_complete: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Indicates whether the user has completed all profile setup steps",
    )
    is_profile_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Indicates whether the user's profile has been verified via face recognition",
    )
    likes_given: Mapped[list["ProfileLike"]] = relationship(
        "ProfileLike",
        back_populates="liker",
        foreign_keys="ProfileLike.liker_id",
        cascade="all, delete-orphan",
    )
    likes_received: Mapped[list["ProfileLike"]] = relationship(
        "ProfileLike",
        back_populates="liked",
        foreign_keys="ProfileLike.liked_id",
        cascade="all, delete-orphan",
    )

    # --- Subscription ---
    subscription_type: Mapped[SubscriptionType | None] = mapped_column(
        Enum(
            SubscriptionType,
            name="subscription_type_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=True,
        default=None,
        comment="Subscription plan: monthly or yearly. None means no active subscription.",
    )
    subscription_start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        comment="When the current subscription period started.",
    )
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        comment="When the current subscription period expires.",
    )
    calls_taken: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of calls used in the current subscription period. Resets on renewal.",
    )
    purchased_calls: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Remaining one-time purchased calls. Consumed before subscription calls.",
    )
