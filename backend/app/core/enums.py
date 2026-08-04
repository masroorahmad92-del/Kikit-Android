from enum import Enum


class OTPSrcEnum(str, Enum):
    EMAIL = "email"
    PHONE = "phone_number"


class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"


class LookingForEnum(str, Enum):
    DATING = "dating"
    FRIENDSHIP = "friendship"
    MARRIAGE = "marriage"


class InterestedInEnum(str, Enum):
    MEN = "men"
    WOMEN = "women"


class CurrentStatusEnum(str, Enum):
    SINGLE = "single"
    MARRIED = "married"
    IN_A_RELATIONSHIP = "in_a_relationship"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    COMPLICATED = "complicated"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class EthnicityEnum(str, Enum):
    ASIAN = "asian"
    PAKISTANI = "pakistani"
    LATIN = "latin"
    EUROPEAN = "european"
    SOUTH_ASIAN = "south_asian"
    MIDDLE_EASTERN = "middle_eastern"
    WHITE_CAUCASIAN = "white_caucasian"
    HISPANIC_LATINO = "hispanic_latino"
    MIXED_RACE = "mixed_race"
    OTHER = "other"


class ProfileReviewStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class NotificationType(str, Enum):
    PROFILE_LIKE = "profile_like"
    PAYOUT_ACCOUNT_ACTIVE = "payout_account_active"
    GIFT_RECEIVED = "gift_received"
    MESSAGE_RECEIVED = "message_received"


class ReportReason(str, Enum):
    INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT"
    SPAM = "SPAM"
    HARASSMENT = "HARASSMENT"
    FAKE_PROFILE = "FAKE_PROFILE"
    OTHER = "OTHER"


class ReportStatus(str, Enum):
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class LiveRoomStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    CANCELLED = "cancelled"


class LiveRoomMemberRole(str, Enum):
    HOST = "host"
    VIEWER = "viewer"
    MODERATOR = "moderator"


class SubscriptionType(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PayoutStatus(str, Enum):
    scheduled = "scheduled"  # queued for future processing
    processing = "processing"  # submitted to Trolley
    completed = "completed"  # Trolley confirmed payment
    failed = "failed"  # Trolley payment failed
