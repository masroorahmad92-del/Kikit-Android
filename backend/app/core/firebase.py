import firebase_admin  # type: ignore[import-untyped]
from firebase_admin import credentials

from app.core import settings
from app.core.logger import logger


def init_firebase() -> None:
    """
    Initialize Firebase Admin SDK with service account credentials.
    """
    logger.info("Initializing Firebase Admin SDK...")
    firebase_creds = {
        "type": "service_account",
        "project_id": settings.FIREBASE_PROJECT_ID,
        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
        "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
        "client_email": settings.FIREBASE_CLIENT_EMAIL,
        "client_id": settings.FIREBASE_CLIENT_ID,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": settings.FIREBASE_CLIENT_X509_CERT_URL,
        "universe_domain": "googleapis.com",
    }

    cred = credentials.Certificate(firebase_creds)

    # Avoid re-initializing if already initialized
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        logger.info("Firebase Admin SDK already initialized.")
