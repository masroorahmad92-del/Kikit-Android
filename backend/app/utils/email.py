def send_email(to_email: str, subject: str, html_content: str) -> None:
    """Dispatch an email via Celery task (retryable, non-blocking)."""
    from app.tasks.email import send_email_task

    send_email_task.delay(to_email, subject, html_content)
