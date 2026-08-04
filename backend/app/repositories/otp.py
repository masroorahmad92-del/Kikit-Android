from sqlalchemy.orm import Session

from app.core.enums import OTPSrcEnum
from app.core.logger import logger
from app.models.otp import OTP
from app.utils.email import send_email


def invalidate_previous_otps(db: Session, recipient: str, source: OTPSrcEnum):
    """Set is_active=False for all previous OTPs for this recipient."""
    db.query(OTP).filter(
        OTP.recipient == recipient, OTP.source == source, OTP.is_active
    ).update({"is_active": False}, synchronize_session=False)
    db.commit()


def create_otp(db: Session, recipient: str, source: OTPSrcEnum, length: int = 4) -> OTP:
    """Invalidate old OTPs and create a new one."""
    try:
        invalidate_previous_otps(db, recipient, source)
        otp = OTP(recipient=recipient, source=source, code=OTP.generate_otp(length))
        db.add(otp)
        db.commit()
        db.refresh(otp)
        return otp
    except Exception as ex:
        logger.error(f"Error creating OTP: {ex}")
        db.rollback()
        raise ex


def create_dev_otp(
    db: Session, recipient: str, source: OTPSrcEnum, length: int = 4
) -> OTP:
    """Invalidate old OTPs and create a new one with a fixed code for development."""
    try:
        invalidate_previous_otps(db, recipient, source)
        otp = OTP(recipient=recipient, source=source, code=OTP.generate_dev_otp(length))
        db.add(otp)
        db.commit()
        db.refresh(otp)
        return otp
    except Exception as ex:
        logger.error(f"Error creating OTP: {ex}")
        db.rollback()
        raise ex


def get_active_otp(db: Session, recipient: str, code: str) -> OTP | None:
    """
    Retrieve the latest active OTP for a recipient matching the code.
    Returns None if OTP is expired or does not exist.
    """
    otp = (
        db.query(OTP)
        .filter(OTP.recipient == recipient, OTP.code == code, OTP.is_active)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if otp and not otp.is_expired():
        return otp
    # Expire it if it's expired
    if otp:
        otp.is_active = False
        db.commit()
    return None


def mark_otp_used(db: Session, otp: OTP):
    """
    Mark OTP as used (inactive).
    """
    otp.is_active = False
    db.commit()


def send_otp_email(to_email: str, otp_code: str):
    subject = "Your OTP Code"
    html_content = f"""
        <p>Dear user,</p>
        <p>Your OTP code is: <strong>{otp_code}</strong></p>
        <p>This code will expire in 5 minutes.</p>
    """
    return send_email(to_email, subject, html_content)
