"""
Seed script to create 100 test users with full profiles.
Usage: python seed_users.py
"""

import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.enums import (
    CurrentStatusEnum,
    EthnicityEnum,
    GenderEnum,
    InterestedInEnum,
    LookingForEnum,
    ProfileReviewStatus,
)
from app.core.security import hash_password
from app.database import get_db
from app.models.profile import Profile
from app.models.user import User
from app.repositories.profile import set_location

# How to run
# python -m app.scripts.dev.seed_users

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

FIRST_NAMES_MALE = [
    "James",
    "John",
    "Robert",
    "Michael",
    "William",
    "David",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Daniel",
    "Matthew",
    "Anthony",
    "Mark",
    "Donald",
    "Steven",
    "Paul",
    "Andrew",
    "Kenneth",
    "George",
]
FIRST_NAMES_FEMALE = [
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Barbara",
    "Elizabeth",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
    "Lisa",
    "Nancy",
    "Betty",
    "Margaret",
    "Sandra",
    "Ashley",
    "Dorothy",
    "Kimberly",
    "Emily",
    "Donna",
]
LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
]

CITIES = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
]
STATES = ["NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA", "TX", "CA"]
COUNTRY = "United States"
COUNTRY_CODE = "+1"

ABOUT_TEMPLATES = [
    "Love exploring new places and trying different cuisines. Always up for an adventure!",
    "Coffee enthusiast, bookworm, and occasional hiker. Looking for someone to share laughs with.",
    "Tech professional by day, amateur chef by night. Let's cook something great together.",
    "Fitness junkie and dog lover. My golden retriever will need to approve of you first.",
    "Creative soul who enjoys art, music, and long walks. Life's too short for boring conversations.",
    "Passionate about travel, photography, and making memories. Where should we explore next?",
    "Simple person with big dreams. I enjoy quiet evenings as much as wild nights out.",
    "Sarcasm is my second language. Looking for someone who can keep up with my wit.",
    "Gym, work, repeat — but also brunch on Sundays. Balance is everything.",
    "Outdoor enthusiast and concert addict. If you love live music, we'll get along great.",
]

HEIGHTS_CM = [str(h) for h in range(155, 196, 2)]  # "155" … "195"


def random_dob() -> str:
    """Return a random date of birth (age 22–45) in DD-MM-YYYY format."""
    today = date.today()
    days_in_range = (45 - 22) * 365
    offset = random.randint(22 * 365, 22 * 365 + days_in_range)
    dob = today - timedelta(days=offset)
    return dob.strftime("%d-%m-%Y")


def random_location():
    """Return (city, state, lat, lon) from a small pool."""
    idx = random.randint(0, len(CITIES) - 1)
    city = CITIES[idx]
    state = STATES[idx]
    # Rough lat/lon for illustration; replace with real coords if needed
    lat = round(random.uniform(25.0, 49.0), 6)
    lon = round(random.uniform(-124.0, -66.0), 6)
    return city, state, lat, lon


def make_password(plain: str) -> str:
    """
    Hash the password using your app's hashing utility.
    Uncomment the real hashing line and remove the plain-text return
    once you've wired up the import at the top of the file.
    """
    return hash_password(plain)


# ──────────────────────────────────────────────
# Core seeder
# ──────────────────────────────────────────────

PASSWORD = "12345678"
TOTAL_USERS = 100


def seed_users(db: Session) -> None:
    created = 0
    skipped = 0

    for i in range(1, TOTAL_USERS + 1):
        email = f"test_user_{i}@yopmail.com"

        # Skip if already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"[SKIP]  {email} already exists.")
            skipped += 1
            continue

        # ── Gender & name ──────────────────────────────
        gender = random.choice([GenderEnum.MALE, GenderEnum.FEMALE])
        if gender == GenderEnum.MALE:
            first_name = random.choice(FIRST_NAMES_MALE)
            interested_in = InterestedInEnum.WOMEN
        else:
            first_name = random.choice(FIRST_NAMES_FEMALE)
            interested_in = InterestedInEnum.MEN

        full_name = f"{first_name} {random.choice(LAST_NAMES)}"

        # ── Location ───────────────────────────────────
        city, state, lat, lon = random_location()

        # ── Create User ────────────────────────────────
        user = User(
            email=email,
            password=make_password(PASSWORD),
            coin_balance=5000,
            diamond_balance=0,
            email_verified=True,
            is_admin=False,
        )
        db.add(user)
        db.flush()  # populate user.id before creating Profile

        # ── Create Profile ─────────────────────────────
        profile = Profile(
            user_id=user.id,
            name=full_name,
            dob=random_dob(),
            country=COUNTRY,
            city=city,
            state=state,
            gender=gender,
            country_code=COUNTRY_CODE,
            # phone_number left None to avoid unique-constraint clashes in bulk seeding
            phone_number=None,
            looking_for=random.sample([e.value for e in LookingForEnum], k=random.randint(1, 3)),
            interested_in=interested_in,
            height=random.choice(HEIGHTS_CM),
            current_status=random.choice(list(CurrentStatusEnum)),
            ethnicity=random.choice(list(EthnicityEnum)),
            about=random.choice(ABOUT_TEMPLATES),
            location_enabled=True,
            latitude=lat,
            longitude=lon,
            acknowledged_terms=True,
            review_status=ProfileReviewStatus.approved,
            is_phone_number_verified=True,
            is_profile_complete=True,
            is_profile_verified=True,
        )
        set_location(profile)
        db.add(profile)

        created += 1
        print(f"[OK]    {email}  →  {full_name}")

        # Commit in batches of 10 to avoid one giant transaction
        if created % 10 == 0:
            db.commit()
            print(f"        ↳ committed batch ({created} users so far)")

    # Final commit for any remainder
    db.commit()
    print(f"\n✅  Done — {created} users created, {skipped} skipped.")


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    # Get a database session.
    # Adjust this block to match how your app initialises SQLAlchemy.
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        seed_users(db)
    except Exception as exc:
        db.rollback()
        print(f"\n❌  Seeding failed: {exc}")
        raise
    finally:
        try:
            next(db_gen)  # allow the generator to clean up
        except StopIteration:
            pass
