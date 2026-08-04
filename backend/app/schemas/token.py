from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    stream_chat_token: str | None = None
    user: dict | None = None
    auth_provider: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
