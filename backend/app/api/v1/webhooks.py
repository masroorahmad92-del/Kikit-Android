from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.enums import NotificationType
from app.core.logger import logger
from app.core.stream import stream_client
from app.database.session import get_db
from app.repositories.profile import get_profile_by_user_id
from app.repositories.user import get_user_by_id
from app.services.notification import notify_user
from app.utils.photos import get_best_photo

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stream-chat")
async def stream_chat_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Handle Stream Chat webhook events.
    Sends push notifications for new messages when the recipient is offline.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"status": "invalid_payload"}, status_code=400)

    event_type = body.get("type")
    logger.info("Stream Chat webhook received: %s", event_type)

    # Handle new message events
    if event_type == "message.new":
        try:
            message = body.get("message", {})
            sender_id = message.get("user", {}).get("id")
            text = message.get("text", "")
            channel_id = body.get("channel", {}).get("id", "")

            if not sender_id or not text:
                return JSONResponse({"status": "ok"})

            # Get channel members to find the recipient
            channel = stream_client.channel(
                channel_type="messaging", channel_id=channel_id
            )
            channel_data = channel.query()
            members = channel_data.get("members", {})

            # Find the recipient (the other user in the DM channel)
            recipient_id = None
            for member_id in members.keys():
                if member_id != sender_id:
                    recipient_id = member_id
                    break

            if not recipient_id:
                return JSONResponse({"status": "ok"})

            # Fetch sender profile
            sender_user = get_user_by_id(db, sender_id)
            if not sender_user:
                return JSONResponse({"status": "ok"})

            sender_profile = get_profile_by_user_id(db, sender_id)
            sender_name = sender_profile.name if sender_profile else "Someone"
            sender_photo = get_best_photo(sender_profile) if sender_profile else None

            # Truncate message for notification
            preview = text[:50] + "..." if len(text) > 50 else text

            # Send push notification to recipient
            notify_user(
                db=db,
                user_id=recipient_id,
                title=f"💬 {sender_name}",
                body=preview,
                type=NotificationType.MESSAGE_RECEIVED.value,
                data={
                    "sender_id": str(sender_id),
                    "sender_name": sender_name,
                    "sender_photo": sender_photo,
                    "channel_id": channel_id,
                    "message_id": message.get("id", ""),
                },
            )

            logger.info(
                "Message notification sent to %s from %s", recipient_id, sender_id
            )

        except Exception as e:
            logger.error("Error processing message.new webhook: %s", e, exc_info=True)
            # Don't fail the webhook - Stream Chat expects 200
            return JSONResponse({"status": "error_logged"})

    return JSONResponse({"status": "ok"})
