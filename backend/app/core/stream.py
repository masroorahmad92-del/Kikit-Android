import hashlib

from stream_chat import StreamChat

from app.core import settings

stream_client = StreamChat(
    api_key=settings.STREAM_API_KEY, api_secret=settings.STREAM_API_SECRET
)


def generate_stream_token(user_id: str):
    return stream_client.create_token(user_id)


def create_dm_channel_id(user1: str, user2: str) -> str:
    members = sorted([user1, user2])
    raw = f"{members[0]}_{members[1]}"
    # sha256 → hex digest → shorten to 40 chars
    digest = hashlib.sha256(raw.encode()).hexdigest()[:40]
    return f"dm_{digest}"
