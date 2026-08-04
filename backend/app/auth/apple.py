# app/auth/apple.py
import time

import httpx
import jwt
from fastapi import HTTPException

from app.core import settings

APPLE_KEY_ID = settings.APPLE_KEY_ID
APPLE_TEAM_ID = settings.APPLE_TEAM_ID
APPLE_CLIENT_ID = settings.APPLE_CLIENT_ID
APPLE_PRIVATE_KEY = settings.APPLE_PRIVATE_KEY


def create_apple_client_secret():
    """Generate client secret for Apple (required for token verification)"""
    headers = {"kid": APPLE_KEY_ID, "alg": "ES256"}

    payload = {
        "iss": APPLE_TEAM_ID,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 180,  # 6 months
        "aud": "https://appleid.apple.com",
        "sub": APPLE_CLIENT_ID,
    }

    client_secret = jwt.encode(
        payload, APPLE_PRIVATE_KEY, algorithm="ES256", headers=headers
    )
    return client_secret


async def verify_apple_token(id_token: str):
    """Verify Apple ID token"""
    try:
        # Decode without verification first to get the key id
        unverified_header = jwt.get_unverified_header(id_token)

        # Get Apple's public keys
        async with httpx.AsyncClient() as client:
            response = await client.get("https://appleid.apple.com/auth/keys")
            apple_keys = response.json()["keys"]

        # Find the matching key
        key_data = None
        for key in apple_keys:
            if key["kid"] == unverified_header["kid"]:
                key_data = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not key_data:
            raise HTTPException(
                status_code=401, detail="Invalid Apple token - key not found"
            )

        # Verify and decode the token
        decoded = jwt.decode(  # type: ignore[arg-type]
            id_token,
            key_data,  # type: ignore[arg-type]
            algorithms=["RS256"],
            audience=APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com",
        )

        user_data = {
            "email": decoded.get("email"),
            "apple_id": decoded.get("sub"),
            "email_verified": decoded.get("email_verified", False),
        }

        return user_data

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Apple token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Apple token: {str(e)}")
