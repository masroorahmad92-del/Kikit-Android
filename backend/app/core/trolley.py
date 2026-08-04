"""
Trolley API client using the trolleyhq SDK.
"""

import hashlib
import hmac
import time
import urllib.parse
from decimal import Decimal

from trolley.configuration import Configuration

from app.core.config import settings


def _client():
    return Configuration.gateway(
        settings.TROLLEY_API_KEY,
        settings.TROLLEY_API_SECRET,
    )


def create_recipient(email: str, first_name: str, last_name: str) -> str:
    """Create a Trolley recipient and return their recipient ID (e.g. 'R-xxxxx')."""
    gateway = _client()
    recipient = gateway.recipient.create(
        {
            "type": "individual",
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
        }
    )
    return recipient.id


def get_widget_url(recipient_id: str, email: str) -> str:
    """
    Build a signed Trolley hosted-widget URL for the given recipient.
    The URL is signed with HMAC-SHA256 and valid for ~30 seconds.
    The frontend opens this URL so the user can enter their payout details.
    """
    params = {
        "key": settings.TROLLEY_API_KEY,
        "ts": str(int(time.time())),
        "email": email,
        "refid": recipient_id,
    }
    query_string = urllib.parse.urlencode(params)
    signature = hmac.new(
        settings.TROLLEY_API_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{settings.TROLLEY_WIDGET_BASE_URL.rstrip('/')}?{query_string}&sign={signature}"


def get_recipient(recipient_id: str) -> dict:
    """Fetch a recipient's full profile from Trolley, including status and accounts."""
    gateway = _client()
    recipient = gateway.recipient.find(recipient_id)
    return {
        "id": recipient.id,
        "status": recipient.status,
        "compliance": getattr(recipient, "compliance", None),
        "accounts": getattr(recipient, "accounts", []),
    }


def create_and_process_payment(
    recipient_id: str,
    amount_usd: Decimal,
    memo: str,
) -> tuple[str, str]:
    """
    Create a single-payment batch, generate a quote, then start processing.
    Returns (batch_id, payment_id).
    """
    gateway = _client()

    batch = gateway.batch.create(
        {
            "description": memo,
            "sourceCurrency": "USD",
            "payments": [
                {
                    "recipient": {"id": recipient_id},
                    "sourceAmount": f"{amount_usd:.2f}",
                    "sourceCurrency": "USD",
                    "memo": memo,
                }
            ],
        }
    )
    batch_id = batch.id

    # Payment ID is embedded in the batch create response
    payment_id = batch.payments["payments"][0]["id"]

    # Required by Trolley before processing: locks in FX rates and fees
    gateway.batch.generate_quote(batch_id)

    gateway.batch.process_batch(batch_id)

    return batch_id, payment_id


def verify_webhook_signature(
    raw_body: bytes, signature_header: str, request_path: str = ""
) -> bool:
    if not signature_header:
        return False

    secrets = [
        s.strip() for s in settings.TROLLEY_WEBHOOK_SECRETS.split(",") if s.strip()
    ]
    if not secrets:
        return False

    timestamp = None
    v1_sig = None

    for part in signature_header.split(","):
        if part.startswith("t="):
            timestamp = part[2:]
        elif part.startswith("v1="):
            v1_sig = part[3:]

    if not timestamp or not v1_sig:
        return False

    # Per Trolley docs: payload = timestamp + raw_body, key = HMAC secret (UTF-8)
    payload = timestamp.encode() + raw_body

    for secret in secrets:
        expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        if hmac.compare_digest(expected, v1_sig):
            return True

    return False
