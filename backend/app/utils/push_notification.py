def send_push_notification(
    fcm_token: str, title: str, body: str, data: dict | None = None
) -> None:
    """Dispatch a push notification via Celery task (retryable, non-blocking)."""
    from app.tasks.notifications import send_push_notification_task

    send_push_notification_task.delay(fcm_token, title, body, data)
