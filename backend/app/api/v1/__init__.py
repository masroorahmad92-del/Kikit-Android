from .announcement import router as announcement_router
from .auth import router as auth_router
from .blocks import router as blocks_router
from .chat import router as chat_router
from .device import router as device_router
from .gifts import router as gifts_router
from .hobby import router as hobby_router
from .interest import router as interest_router
from .live_rooms import router as live_rooms_router
from .matches import router as matches_router
from .media import router as media_router
from .notification import router as notification_router
from .otp import router as otp_router
from .payouts import router as payouts_router
from .phone_verification import router as phone_verification_router
from .preferences import router as preferences_router
from .profile import router as profile_router
from .profile_likes import router as profile_likes_router
from .profile_skip import router as profile_skip_router
from .revenuecat import router as revenuecat_router
from .user import router as user_router
from .user_report import router as user_report_router
from .webhooks import router as webhook_router

__all__ = [
    "announcement_router",
    "auth_router",
    "blocks_router",
    "chat_router",
    "device_router",
    "hobby_router",
    "interest_router",
    "live_rooms_router",
    "matches_router",
    "media_router",
    "otp_router",
    "phone_verification_router",
    "preferences_router",
    "profile_router",
    "profile_likes_router",
    "user_router",
    "notification_router",
    "gifts_router",
    "user_report_router",
    "profile_skip_router",
    "payouts_router",
    "revenuecat_router",
    "webhook_router",
]
