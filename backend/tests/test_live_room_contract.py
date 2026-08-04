import inspect
import unittest

from app.services import gift as gift_service
from app.services import live_room


class LiveRoomContractTest(unittest.TestCase):
    def test_live_rooms_require_verified_profiles(self):
        source = inspect.getsource(live_room._ensure_verified)

        self.assertIn("is_profile_complete", source)
        self.assertIn("is_profile_verified", source)
        self.assertIn("Verified members only", source)

    def test_live_room_actions_keep_host_only_controls(self):
        source = inspect.getsource(live_room._get_room_for_action)

        self.assertIn("host_only", source)
        self.assertIn("Only the room host can do this", source)

    def test_live_room_join_respects_blocks(self):
        source = inspect.getsource(live_room.join_live_room)

        self.assertIn("is_user_blocked_between", source)
        self.assertIn("You cannot join this room", source)

    def test_live_room_gifts_can_only_target_host(self):
        source = inspect.getsource(gift_service.send_gift)

        self.assertIn("live_room_id", source)
        self.assertIn("Live room gifts can only be sent to the host", source)


if __name__ == "__main__":
    unittest.main()
