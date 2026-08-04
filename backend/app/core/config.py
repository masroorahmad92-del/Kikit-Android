import json
from functools import cached_property

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DEBUG: bool = Field(
        False,
        description="Enable debug mode for development. Should be set to False in production for security and performance reasons.",
    )
    DATABASE_URL: str = Field(..., description="Database connection string")
    SECRET: str = Field(..., description="Secret key for signing JWTs")
    ALGORITHM: str = Field("HS256", description="Algorithm used for JWT encoding")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        1440, description="Access token expiration time in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        7, description="Refresh token expiration time in days"
    )
    AWS_ACCESS_KEY_ID: str = Field(..., description="AWS Access Key ID")
    AWS_SECRET_ACCESS_KEY: str = Field(..., description="AWS Secret Access Key")
    AWS_S3_BUCKET_NAME: str = Field(..., description="AWS S3 Bucket Name")
    AWS_REGION: str = Field(..., description="AWS Region")
    CLOUDINARY_CLOUD_NAME: str = Field(..., description="Cloudinary Cloud Name")
    CLOUDINARY_API_KEY: str = Field(..., description="Cloudinary API Key")
    CLOUDINARY_API_SECRET: str = Field(..., description="Cloudinary API Secret")
    SENDGRID_API_KEY: str = Field(..., description="SendGrid API Key")
    FROM_EMAIL: str = Field(
        ..., description="Verified sender email address for SendGrid"
    )
    REDIS_URL: str = Field(..., description="Redis URL for caching")
    CELERY_BROKER_URL: str = Field(..., description="Celery broker URL")
    CELERY_RESULT_BACKEND: str = Field(..., description="Celery result backend URL")
    STREAM_API_KEY: str = Field(..., description="Stream Chat API Key")
    STREAM_API_SECRET: str = Field(..., description="Stream Chat API Secret")
    FIREBASE_PROJECT_ID: str = Field(..., description="Firebase Project ID")
    FIREBASE_PRIVATE_KEY_ID: str = Field(..., description="Firebase Private Key ID")
    FIREBASE_PRIVATE_KEY: str = Field(..., description="Firebase Private Key")
    FIREBASE_CLIENT_EMAIL: str = Field(..., description="Firebase Client Email")
    FIREBASE_CLIENT_ID: str = Field(..., description="Firebase Client ID")
    FIREBASE_CLIENT_X509_CERT_URL: str = Field(
        ..., description="Firebase Client X509 Cert URL"
    )
    GOOGLE_CLIENT_ID: str = Field(..., description="Google OAuth2 Client ID")
    APPLE_KEY_ID: str = Field(..., description="Apple Sign-In Key ID")
    APPLE_TEAM_ID: str = Field(..., description="Apple Sign-In Team ID")
    APPLE_CLIENT_ID: str = Field(..., description="Apple Sign-In Client ID")
    APPLE_PRIVATE_KEY: str = Field(..., description="Path to Apple Sign-In")
    COIN_PACKS_JSON: str = Field(..., description="JSON string defining coin packs")
    FACE_MATCH_THRESHOLD: float = Field(
        0.35, description="Threshold for face verification matching"
    )
    FACE_MIN_MATCHES: int = Field(
        3, description="Minimum number of matches required for face verification"
    )
    OTP_BYPASS_EMAILS: str = Field(
        "", description="Comma-separated list of emails that bypass OTP verification"
    )
    REVENUECAT_WEBHOOK_SECRET: str = Field(
        "", description="Bearer token RevenueCat sends in webhook Authorization header"
    )
    DOCS_USERNAME: str = Field(..., description="Username for Swagger UI access")
    DOCS_PASSWORD: str = Field(..., description="Password for Swagger UI access")

    # Trolley payout settings
    TROLLEY_API_KEY: str = Field("", description="Trolley API key")
    TROLLEY_API_SECRET: str = Field("", description="Trolley API secret")
    TROLLEY_WEBHOOK_SECRETS: str = Field(
        "",
        description="Comma-separated Trolley HMAC signing secrets (one per webhook)",
    )
    TROLLEY_BASE_URL: str = Field(
        "https://api.trolley.com", description="Trolley API base URL"
    )
    TROLLEY_WIDGET_BASE_URL: str = Field(
        "https://widget.trolley.com", description="Trolley hosted widget base URL"
    )
    # Diamond-to-cash conversion: 1 diamond = $0.01 USD (100 diamonds = $1)
    DIAMONDS_PER_DOLLAR: int = Field(
        100, description="Number of diamonds equivalent to $1 USD"
    )
    # Coin-to-diamond value ratio after Apple 30% fee (user receives 42% back in diamond value)
    COINS_TO_DIAMONDS_RATIO: float = Field(
        0.42,
        description="Fraction of coin value returned as diamond value (after Apple 30% fee)",
    )
    # Days to delay payout processing after request (0 = immediate)
    PAYOUT_DELAY_DAYS: int = Field(
        0,
        description="Days between payout request and Trolley batch submission (0 = immediate)",
    )
    # Minimum diamonds required to request a payout ($100 at $0.01/diamond)
    MIN_PAYOUT_DIAMONDS: int = Field(
        10_000, description="Minimum diamonds required to request a payout"
    )
    # Maximum diamonds allowed in a single payout request ($1,000 at $0.01/diamond)
    MAX_PAYOUT_DIAMONDS: int = Field(
        100_000, description="Maximum diamonds allowed in a single payout request"
    )
    PAYOUT_PROCESSING_DAYS: int = Field(
        14, description="Expected number of days until payout is processed and received"
    )

    @cached_property
    def OTP_BYPASS_EMAIL_SET(self) -> set[str]:
        return {
            e.strip().lower() for e in self.OTP_BYPASS_EMAILS.split(",") if e.strip()
        }

    @cached_property
    def COIN_PACKS(self) -> dict:
        return json.loads(self.COIN_PACKS_JSON)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()  # type: ignore
