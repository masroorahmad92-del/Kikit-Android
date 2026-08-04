from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Interest, InterestCategory
from app.models.user import User
from app.repositories.matches import get_discover_profiles, get_matching_profiles
from app.schemas.profile import ProfileRead
from app.utils.distance import haversine_km


def get_user_matches(
    *,
    db: Session,
    current_user: User,
    limit: int = 999,
):
    """Retrieve user profiles that match the current user's preferences."""
    profile = current_user.profile
    if not profile:
        return []

    profiles = get_matching_profiles(db, profile, limit)

    # Annotate distance using Haversine — no DB queries
    user_lat = profile.latitude
    user_lng = profile.longitude
    location_known = (
        profile.location_enabled and user_lat is not None and user_lng is not None
    )

    for p in profiles:
        if (
            location_known
            and p.location_enabled
            and p.latitude is not None
            and p.longitude is not None
        ):
            p.distance_km = haversine_km(user_lat, user_lng, p.latitude, p.longitude)  # type: ignore[attr-defined, arg-type]
        else:
            p.distance_km = None  # type: ignore[attr-defined]

    return profiles


def get_user_discover(
    *,
    db: Session,
    current_user: User,
    interest_id: UUID | None = None,
    category_id: UUID | None = None,
    limit: int = 30,
    offset: int = 0,
) -> dict:
    """Retrieve interest-first Discover results with lightweight context."""
    profile = current_user.profile
    if not profile:
        return {
            "profiles": [],
            "selected_interest": None,
            "selected_category": None,
            "has_more": False,
            "limit": limit,
            "offset": offset,
        }

    selected_interest = (
        db.query(Interest).filter(Interest.id == interest_id).first()
        if interest_id
        else None
    )
    selected_category = (
        db.query(InterestCategory).filter(InterestCategory.id == category_id).first()
        if category_id
        else None
    )

    profiles = get_discover_profiles(
        db,
        profile,
        interest_id=interest_id,
        category_id=category_id,
        limit=limit + 1,
        offset=offset,
    )
    has_more = len(profiles) > limit
    profiles = profiles[:limit]

    user_interest_ids = {str(interest.id) for interest in profile.interests}
    user_lat = profile.latitude
    user_lng = profile.longitude
    location_known = (
        profile.location_enabled and user_lat is not None and user_lng is not None
    )

    data = []
    for candidate in profiles:
        if (
            location_known
            and candidate.location_enabled
            and candidate.latitude is not None
            and candidate.longitude is not None
        ):
            candidate.distance_km = haversine_km(  # type: ignore[attr-defined]
                user_lat, user_lng, candidate.latitude, candidate.longitude
            )
        else:
            candidate.distance_km = None  # type: ignore[attr-defined]

        serialized = ProfileRead.model_validate(
            candidate, from_attributes=True
        ).model_dump()
        shared_interests = [
            {"id": str(interest.id), "name": interest.name}
            for interest in candidate.interests
            if str(interest.id) in user_interest_ids
        ]
        serialized["shared_interests"] = shared_interests

        if selected_interest:
            reason = f"Connected through {selected_interest.name}"
        elif selected_category:
            reason = f"Active in {selected_category.name}"
        elif shared_interests:
            reason = f"You both like {shared_interests[0]['name']}"
        else:
            reason = "A verified member to discover"
        serialized["discover_reason"] = reason
        data.append(serialized)

    return {
        "profiles": data,
        "selected_interest": (
            {"id": str(selected_interest.id), "name": selected_interest.name}
            if selected_interest
            else None
        ),
        "selected_category": (
            {"id": str(selected_category.id), "name": selected_category.name}
            if selected_category
            else None
        ),
        "has_more": has_more,
        "limit": limit,
        "offset": offset,
    }
