"""Create or refresh the App Store review demo account and sample live rooms.

Usage:
  python -m app.scripts.dev.seed_app_review_user

Requires OTP_BYPASS_EMAILS=appreview@letskikit.com on the production server.
"""

from app.core.enums import (
    CurrentStatusEnum,
    EthnicityEnum,
    GenderEnum,
    InterestedInEnum,
    LookingForEnum,
    ProfileReviewStatus,
)
from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.profile import Profile
from app.models.user import User
from app.repositories.profile import set_location
from app.scripts.dev.seed_live_rooms import main as seed_live_rooms

REVIEW_EMAIL = "appreview@letskikit.com"
REVIEW_PASSWORD = "AppReview2026!"


def main() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == REVIEW_EMAIL).first()
        if user:
            user.password = hash_password(REVIEW_PASSWORD)
            user.email_verified = True
            user.is_active = True
            user.coin_balance = 5000
            profile = user.profile
            if profile:
                profile.is_profile_complete = True
                profile.is_profile_verified = True
                profile.review_status = ProfileReviewStatus.approved
                profile.acknowledged_terms = True
            print(f"[OK] Updated existing review account: {REVIEW_EMAIL}")
        else:
            user = User(
                email=REVIEW_EMAIL,
                password=hash_password(REVIEW_PASSWORD),
                coin_balance=5000,
                diamond_balance=0,
                email_verified=True,
                is_admin=False,
                is_active=True,
            )
            db.add(user)
            db.flush()

            profile = Profile(
                user_id=user.id,
                name="Alex Rivera",
                dob="01-01-1990",
                country="United States",
                city="Houston",
                state="TX",
                gender=GenderEnum.MALE,
                country_code="+1",
                phone_number=None,
                looking_for=[LookingForEnum.FRIENDSHIP.value, LookingForEnum.DATING.value],
                interested_in=InterestedInEnum.WOMEN,
                height="180",
                current_status=CurrentStatusEnum.SINGLE,
                ethnicity=EthnicityEnum.LATIN,
                about="Music and travel enthusiast. Hosts verified live room hangouts on Kikit.",
                location_enabled=True,
                latitude=40.7128,
                longitude=-74.0060,
                acknowledged_terms=True,
                review_status=ProfileReviewStatus.approved,
                is_phone_number_verified=True,
                is_profile_complete=True,
                is_profile_verified=True,
            )
            set_location(profile)
            db.add(profile)
            print(f"[OK] Created review account: {REVIEW_EMAIL}")

        db.commit()
    finally:
        db.close()

    seed_live_rooms(REVIEW_EMAIL)
    print("\nDone. Required on production (Render):")
    print("  OTP_BYPASS_EMAILS=appreview@letskikit.com")
    print("\nApp Store Connect → App Review Information:")
    print(f"  Email: {REVIEW_EMAIL}")
    print(f"  Password: {REVIEW_PASSWORD}")
    print("  Sign in via: Continue with Email (not Sign in with Apple)")


if __name__ == "__main__":
    main()
