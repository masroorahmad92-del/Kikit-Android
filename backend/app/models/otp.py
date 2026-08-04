import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import OTPSrcEnum
from app.database.base import BaseModel


class OTP(BaseModel):
    __tablename__ = "otp"

    source: Mapped[OTPSrcEnum] = mapped_column(
        Enum(OTPSrcEnum, name="otp_src_enum"),
        nullable=False,
    )  # email or phone (type)
    recipient: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # email or phone number (value)
    code: Mapped[str] = mapped_column(String(6), nullable=False)  # OTP code

    @staticmethod
    def generate_otp(length: int = 4) -> str:
        """Generate a random numeric OTP of given length."""
        return "".join(str(secrets.randbelow(10)) for _ in range(length))

    @staticmethod
    def generate_dev_otp(length: int = 4) -> str:
        """Return a fixed OTP (useful for development/testing)."""
        return "0" * length

    def is_expired(self) -> bool:
        """Check if the OTP has expired."""
        return datetime.now(timezone.utc) > (self.created_at + timedelta(minutes=5))

    def verify_code(self, code: str) -> bool:
        """Verify if the provided code matches the stored OTP code and is not expired."""
        is_valid = self.code == code and not self.is_expired()
        if not is_valid:
            self.is_active = False
        return is_valid
