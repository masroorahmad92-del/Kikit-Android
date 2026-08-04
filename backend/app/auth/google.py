# app/auth/google.py

from fastapi import HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token

from app.core import settings

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID


async def verify_google_token(token: str):
    try:
        import asyncio

        # Run the synchronous Google HTTP call in a thread to avoid blocking the event loop
        idinfo = await asyncio.to_thread(
            id_token.verify_oauth2_token, token, requests.Request(), GOOGLE_CLIENT_ID
        )

        # Token is valid, extract user info
        user_data = {
            "email": idinfo.get("email"),
            "google_id": idinfo.get("sub"),
            "email_verified": idinfo.get("email_verified", False),
            "name": idinfo.get("name"),
        }

        return user_data

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail="Invalid Google token")
