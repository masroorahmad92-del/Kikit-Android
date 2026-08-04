"""Repair Stream chat channels for existing mutual profile likes.

Run with:
    uv run python -m app.scripts.repair_mutual_match_channels

Use --dry-run to inspect what would be created without touching Stream.
"""

from __future__ import annotations

import argparse
from collections.abc import Iterable

from sqlalchemy.orm import Session

from app.core.logger import logger
from app.core.stream import create_dm_channel_id, stream_client
from app.database.session import SessionLocal
from app.models.profile import Profile
from app.models.profile_likes import ProfileLike
from app.repositories.chat import create_one_to_one_channel


def _stream_channel_exists(channel_id: str) -> bool:
    response = stream_client.query_channels(
        {"id": channel_id},
        {"created_at": -1},
        limit=1,
    )
    return bool(response.get("channels", []))


def _mutual_profile_pairs(db: Session) -> list[tuple[str, str]]:
    likes = db.query(ProfileLike.liker_id, ProfileLike.liked_id).all()
    seen = {(str(liker_id), str(liked_id)) for liker_id, liked_id in likes}
    pairs: list[tuple[str, str]] = []
    visited: set[tuple[str, str]] = set()

    for liker_id, liked_id in seen:
        pair_key = tuple(sorted((liker_id, liked_id)))
        if pair_key in visited:
            continue
        if (liked_id, liker_id) in seen:
            visited.add(pair_key)
            pairs.append((liker_id, liked_id))

    return pairs


def _profile_map(db: Session, profile_ids: Iterable[str]) -> dict[str, Profile]:
    profiles = db.query(Profile).filter(Profile.id.in_(list(profile_ids))).all()
    return {str(profile.id): profile for profile in profiles}


def repair_mutual_match_channels(*, dry_run: bool = False) -> dict[str, int]:
    stats = {
        "mutual_pairs": 0,
        "already_exists": 0,
        "created": 0,
        "missing_profiles": 0,
        "errors": 0,
    }

    db = SessionLocal()
    try:
        pairs = _mutual_profile_pairs(db)
        stats["mutual_pairs"] = len(pairs)
        profile_ids = {profile_id for pair in pairs for profile_id in pair}
        profiles_by_id = _profile_map(db, profile_ids)

        for profile_a_id, profile_b_id in pairs:
            profile_a = profiles_by_id.get(profile_a_id)
            profile_b = profiles_by_id.get(profile_b_id)
            if not profile_a or not profile_b:
                stats["missing_profiles"] += 1
                logger.warning(
                    "Skipping mutual like pair with missing profile: %s <-> %s",
                    profile_a_id,
                    profile_b_id,
                )
                continue

            user_a_id = str(profile_a.user_id)
            user_b_id = str(profile_b.user_id)
            channel_id = create_dm_channel_id(user_a_id, user_b_id)

            try:
                if _stream_channel_exists(channel_id):
                    stats["already_exists"] += 1
                    continue

                if dry_run:
                    logger.info(
                        "Would create Stream channel %s for users %s and %s",
                        channel_id,
                        user_a_id,
                        user_b_id,
                    )
                    continue

                created_channel_id = create_one_to_one_channel(db, user_a_id, user_b_id)
                if _stream_channel_exists(created_channel_id):
                    stats["created"] += 1
                else:
                    stats["errors"] += 1
                    logger.error(
                        "Stream channel %s was still missing after repair attempt",
                        created_channel_id,
                    )
            except Exception:
                stats["errors"] += 1
                logger.exception(
                    "Failed repairing Stream channel %s for profiles %s and %s",
                    channel_id,
                    profile_a_id,
                    profile_b_id,
                )
    finally:
        db.close()

    return stats


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create missing Stream channels for mutual profile likes."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print what would be repaired.",
    )
    args = parser.parse_args()

    stats = repair_mutual_match_channels(dry_run=args.dry_run)
    print("repair_mutual_match_channels:", stats)
    return 1 if stats["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
