from typing import Optional

from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str
    full_name: Optional[str] = None


class AppleAuthRequest(BaseModel):
    id_token: str
    full_name: Optional[str] = None
