from app.core.celery import celery_app
from app.core.logger import logger


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def upsert_stream_chat_user(
    self, user_id: str, name: str | None = None, image: str | None = None
):
    """Upsert a Stream Chat user with retry on failure."""
    try:
        from app.core.stream import stream_client

        payload: dict = {"id": user_id}
        if name:
            payload["name"] = name
        if image:
            payload["image"] = image

        stream_client.upsert_user(payload)
    except Exception as exc:
        logger.error("Stream Chat upsert failed for user %s: %s", user_id, exc)
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def delete_stream_chat_user(self, user_id: str):
    """Hard-delete a Stream Chat user with retry on failure."""
    try:
        from app.core.stream import stream_client

        stream_client.delete_user(user_id, hard_delete=True)
    except Exception as exc:
        logger.error("Stream Chat delete failed for user %s: %s", user_id, exc)
        raise self.retry(exc=exc)
