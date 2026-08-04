from app.core.celery import celery_app
from app.core.logger import logger


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def send_email_task(self, to_email: str, subject: str, html_content: str):
    """Send an email via SendGrid with retry on failure."""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        from app.core import settings

        message = Mail(
            from_email=settings.FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        raise self.retry(exc=exc)
