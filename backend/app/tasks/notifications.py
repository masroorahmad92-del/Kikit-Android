from app.core.celery import celery_app
from app.core.logger import logger


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def send_push_notification_task(
    self, fcm_token: str, title: str, body: str, data: dict | None = None
):
    """Send a Firebase push notification with retry on failure."""
    try:
        import firebase_admin
        from firebase_admin import messaging

        # Initialize Firebase if the Celery worker hasn't done so yet
        if not firebase_admin._apps:
            from app.core.firebase import init_firebase

            init_firebase()

        message = messaging.Message(
            token=fcm_token,
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
        )
        messaging.send(message)
    except Exception as exc:
        logger.error("Push notification failed to %s: %s", fcm_token, exc)
        raise self.retry(exc=exc)
