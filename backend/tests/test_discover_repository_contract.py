import inspect
import unittest

from app.repositories.matches import get_discover_profiles


class DiscoverRepositoryContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = inspect.getsource(get_discover_profiles)

    def test_discover_keeps_category_and_interest_filters(self):
        self.assertIn(
            "Profile.interests.any(Interest.id == interest_id)",
            self.source,
        )
        self.assertIn(
            "Profile.interests.any(Interest.category_id == category_id)",
            self.source,
        )

    def test_discover_keeps_safety_and_seen_exclusions(self):
        expected_contract = [
            "Profile.is_profile_complete.is_(True)",
            "Profile.is_profile_verified.is_(True)",
            "ProfileSkip.skipped_id",
            "ProfileSkip.skipper_id",
            "ProfileLike.liked_id",
            "ProfileLike.liker_id",
            "blocked_user_ids_select(profile.user_id)",
        ]

        for expected in expected_contract:
            with self.subTest(expected=expected):
                self.assertIn(expected, self.source)

    def test_discover_keeps_offset_pagination(self):
        self.assertIn(".offset(offset).limit(limit).all()", self.source)


if __name__ == "__main__":
    unittest.main()
