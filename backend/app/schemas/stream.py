from typing import List

from pydantic import BaseModel


class StreamChannelResponse(BaseModel):
    channel_id: str
    members: List[str]
