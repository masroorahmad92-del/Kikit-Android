from fastapi import FastAPI

from .exceptions import register_exception_handlers
from .v1 import (
    announcement_router,
    auth_router,
    blocks_router,
    chat_router,
    device_router,
    gifts_router,
    hobby_router,
    interest_router,
    live_rooms_router,
    matches_router,
    media_router,
    notification_router,
    otp_router,
    payouts_router,
    phone_verification_router,
    preferences_router,
    profile_likes_router,
    profile_router,
    profile_skip_router,
    revenuecat_router,
    user_report_router,
    user_router,
    webhook_router,
)


def include_routers(app: FastAPI) -> None:
    """Include all API routers in the FastAPI application."""

    routers = [
        user_router,
        blocks_router,
        profile_router,
        otp_router,
        auth_router,
        hobby_router,
        interest_router,
        live_rooms_router,
        media_router,
        phone_verification_router,
        matches_router,
        preferences_router,
        profile_likes_router,
        chat_router,
        device_router,
        announcement_router,
        notification_router,
        gifts_router,
        user_report_router,
        profile_skip_router,
        payouts_router,
        revenuecat_router,
        webhook_router,
    ]

    for router in routers:
        app.include_router(router, prefix="/api/v1")


__all__ = ["include_routers", "register_exception_handlers"]
