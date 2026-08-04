from sqlalchemy import String, cast, func, literal, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.enums import GenderEnum, InterestedInEnum
from app.core.logger import logger
from app.models import Interest, Profile
from app.models.profile_likes import ProfileLike
from app.models.profile_skip import ProfileSkip
from app.repositories.user_block import blocked_user_ids_select
from app.models.user_hobbies import user_hobbies
from app.models.user_interests import user_interests
from app.models.user_preferences import UserPreferences


def _count_shared(table, fk_col, id_col, ids):
    """
    Correlated subquery: count rows in `table` where `fk_col` matches the
    outer Profile.id and `id_col` is in `ids`. Returns literal(0) when
    `ids` is empty to avoid an invalid IN () expression.
    """
    if not ids:
        return literal(0)
    return (
        select(func.count())
        .select_from(table)
        .where(fk_col == Profile.id, id_col.in_(ids))
        .correlate(Profile)
        .scalar_subquery()
    )


def get_matching_profiles(
    db: Session, profile: Profile, limit: int = 999
) -> list[Profile]:
    """
    Retrieve and rank profiles that best match the given user's profile
    based on mutual preferences, demographics, and optional distance filtering.
    """

    prefs: UserPreferences | None = profile.user.preferences

    # Subquery: all profiles this user has already interacted with,
    # plus profiles that have already skipped this user (no match possible).
    seen_profile_ids = (
        db.query(ProfileSkip.skipped_id)
        .filter(ProfileSkip.skipper_id == profile.id)
        .union(
            db.query(ProfileLike.liked_id).filter(ProfileLike.liker_id == profile.id)
        )
        .union(
            db.query(ProfileLike.liker_id).filter(ProfileLike.liked_id == profile.id)
        )
        .union(
            # Exclude profiles that have already skipped this user — showing
            # them is pointless since a mutual match can never happen.
            db.query(ProfileSkip.skipper_id).filter(
                ProfileSkip.skipped_id == profile.id
            )
        )
    ).subquery()

    # Base query with eager loading to avoid N+1 on serialization and scoring
    query = (
        db.query(Profile)
        .options(
            selectinload(Profile.hobbies),
            selectinload(Profile.interests),
            selectinload(Profile.photos),
            joinedload(Profile.user),
        )
        .filter(Profile.id != profile.id)
        .filter(Profile.is_profile_complete.is_(True))
        .filter(Profile.is_profile_verified.is_(True))
        .filter(~Profile.id.in_(seen_profile_ids))  # type: ignore[arg-type]
        .filter(~Profile.user_id.in_(blocked_user_ids_select(profile.user_id)))  # type: ignore[arg-type]
    )

    logger.info(f"User Preferences: {prefs} for profile ID {profile.id}, limit {limit}")

    if not prefs:
        profiles = query.limit(limit).all()
        logger.info(
            f"No user preferences set; returning {len(profiles)} unfiltered profiles."
        )
        return profiles

    # --------------------------------------------------
    # Gender & mutual interest filtering
    # --------------------------------------------------
    # If interested_in is NULL, default to showing the opposite gender
    # (most common use case) so we don't accidentally return all genders.
    if profile.gender == GenderEnum.MALE:
        # Male user: show females (default if interested_in is not set)
        target_gender = GenderEnum.FEMALE
        if profile.interested_in == InterestedInEnum.MEN:
            target_gender = GenderEnum.MALE
        query = query.filter(Profile.gender == target_gender)

        # Mutual interest: females who are interested in men
        query = query.filter(Profile.interested_in.in_([InterestedInEnum.MEN]))

    elif profile.gender == GenderEnum.FEMALE:
        # Female user: show males (default if interested_in is not set)
        target_gender = GenderEnum.MALE
        if profile.interested_in == InterestedInEnum.MEN:
            target_gender = GenderEnum.MALE
        query = query.filter(Profile.gender == target_gender)

        # Mutual interest: males who are interested in women
        query = query.filter(Profile.interested_in.in_([InterestedInEnum.WOMEN]))

    # --------------------------------------------------
    # Relationship type filtering (multi-select: show profiles matching any chosen type)
    # --------------------------------------------------
    if prefs.looking_for:
        # Use PostgreSQL ARRAY overlap operator (&&): show profiles whose
        # looking_for array shares at least one value with the user's prefs.
        query = query.filter(
            Profile.looking_for.overlap(cast(prefs.looking_for, ARRAY(String)))  # type: ignore[arg-type]
        )

    # --------------------------------------------------
    # Age range filtering
    # --------------------------------------------------
    if prefs.min_age:
        query = query.filter(
            func.date_part(
                "year",
                func.age(func.to_date(Profile.dob, "DD-MM-YYYY")),
            )
            >= prefs.min_age
        )

    if prefs.max_age:
        query = query.filter(
            func.date_part(
                "year",
                func.age(func.to_date(Profile.dob, "DD-MM-YYYY")),
            )
            <= prefs.max_age
        )

    # --------------------------------------------------
    # Ethnicity filtering (multi-select: show profiles matching any chosen ethnicity)
    # --------------------------------------------------
    if prefs.ethnicity:
        active = [e for e in prefs.ethnicity if e not in ("any", "no_preference")]
        if active:
            query = query.filter(Profile.ethnicity.in_(active))

    # --------------------------------------------------
    # Country filtering (multi-select: show profiles from any chosen country)
    # --------------------------------------------------
    if prefs.country:
        query = query.filter(Profile.country.in_(prefs.country))

    # --------------------------------------------------
    # Ranking phase — score computed in SQL, no full table load into Python
    # Weights: shared hobbies ×3, shared interests ×2,
    #          pref-matched hobbies ×4, pref-matched interests ×3
    # --------------------------------------------------
    user_hobby_ids = [h.id for h in profile.hobbies]
    user_interest_ids = [i.id for i in profile.interests]
    pref_hobby_ids = [h.id for h in prefs.hobbies]
    pref_interest_ids = [i.id for i in prefs.interests]

    score_expr = (
        _count_shared(
            user_hobbies,
            user_hobbies.c.profile_id,
            user_hobbies.c.hobby_id,
            user_hobby_ids,
        )
        * 3
        + _count_shared(
            user_interests,
            user_interests.c.profile_id,
            user_interests.c.interest_id,
            user_interest_ids,
        )
        * 2
        + _count_shared(
            user_hobbies,
            user_hobbies.c.profile_id,
            user_hobbies.c.hobby_id,
            pref_hobby_ids,
        )
        * 4
        + _count_shared(
            user_interests,
            user_interests.c.profile_id,
            user_interests.c.interest_id,
            pref_interest_ids,
        )
        * 3
    )

    return query.order_by(score_expr.desc()).limit(limit).all()


def get_discover_profiles(
    db: Session,
    profile: Profile,
    interest_id=None,
    category_id=None,
    limit: int = 30,
    offset: int = 0,
) -> list[Profile]:
    """
    Retrieve profiles for the interest-first Discover surface while preserving
    the same safety and matching exclusions as the legacy matches endpoint.
    """
    prefs: UserPreferences | None = profile.user.preferences

    seen_profile_ids = (
        db.query(ProfileSkip.skipped_id)
        .filter(ProfileSkip.skipper_id == profile.id)
        .union(
            db.query(ProfileLike.liked_id).filter(ProfileLike.liker_id == profile.id)
        )
        .union(
            db.query(ProfileLike.liker_id).filter(ProfileLike.liked_id == profile.id)
        )
        .union(
            db.query(ProfileSkip.skipper_id).filter(
                ProfileSkip.skipped_id == profile.id
            )
        )
    ).subquery()

    query = (
        db.query(Profile)
        .options(
            selectinload(Profile.hobbies),
            selectinload(Profile.interests),
            selectinload(Profile.photos),
            joinedload(Profile.user),
        )
        .filter(Profile.id != profile.id)
        .filter(Profile.is_profile_complete.is_(True))
        .filter(Profile.is_profile_verified.is_(True))
        .filter(~Profile.id.in_(seen_profile_ids))  # type: ignore[arg-type]
        .filter(~Profile.user_id.in_(blocked_user_ids_select(profile.user_id)))  # type: ignore[arg-type]
    )

    if profile.gender == GenderEnum.MALE:
        target_gender = GenderEnum.FEMALE
        if profile.interested_in == InterestedInEnum.MEN:
            target_gender = GenderEnum.MALE
        query = query.filter(Profile.gender == target_gender)
        query = query.filter(Profile.interested_in.in_([InterestedInEnum.MEN]))
    elif profile.gender == GenderEnum.FEMALE:
        target_gender = GenderEnum.MALE
        if profile.interested_in == InterestedInEnum.MEN:
            target_gender = GenderEnum.MALE
        query = query.filter(Profile.gender == target_gender)
        query = query.filter(Profile.interested_in.in_([InterestedInEnum.WOMEN]))

    if prefs:
        if prefs.looking_for:
            query = query.filter(
                Profile.looking_for.overlap(cast(prefs.looking_for, ARRAY(String)))  # type: ignore[arg-type]
            )
        if prefs.min_age:
            query = query.filter(
                func.date_part(
                    "year",
                    func.age(func.to_date(Profile.dob, "DD-MM-YYYY")),
                )
                >= prefs.min_age
            )
        if prefs.max_age:
            query = query.filter(
                func.date_part(
                    "year",
                    func.age(func.to_date(Profile.dob, "DD-MM-YYYY")),
                )
                <= prefs.max_age
            )
        if prefs.ethnicity:
            active = [e for e in prefs.ethnicity if e not in ("any", "no_preference")]
            if active:
                query = query.filter(Profile.ethnicity.in_(active))
        if prefs.country:
            query = query.filter(Profile.country.in_(prefs.country))

    if interest_id:
        query = query.filter(Profile.interests.any(Interest.id == interest_id))
    if category_id:
        query = query.filter(Profile.interests.any(Interest.category_id == category_id))

    user_hobby_ids = [h.id for h in profile.hobbies]
    user_interest_ids = [i.id for i in profile.interests]
    pref_hobby_ids = [h.id for h in prefs.hobbies] if prefs else []
    pref_interest_ids = [i.id for i in prefs.interests] if prefs else []

    score_expr = (
        _count_shared(
            user_hobbies,
            user_hobbies.c.profile_id,
            user_hobbies.c.hobby_id,
            user_hobby_ids,
        )
        * 3
        + _count_shared(
            user_interests,
            user_interests.c.profile_id,
            user_interests.c.interest_id,
            user_interest_ids,
        )
        * 2
        + _count_shared(
            user_hobbies,
            user_hobbies.c.profile_id,
            user_hobbies.c.hobby_id,
            pref_hobby_ids,
        )
        * 4
        + _count_shared(
            user_interests,
            user_interests.c.profile_id,
            user_interests.c.interest_id,
            pref_interest_ids,
        )
        * 3
    )

    return query.order_by(score_expr.desc(), Profile.created_at.desc()).offset(offset).limit(limit).all()
