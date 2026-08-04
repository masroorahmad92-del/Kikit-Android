from celery import Celery
from celery.schedules import crontab

from app.core import settings

celery_app = Celery(
    "worker", broker=settings.CELERY_BROKER_URL, backend=settings.CELERY_RESULT_BACKEND
)

celery_app.autodiscover_tasks(["app.tasks"])

# Run daily at midnight to catch any subscriptions that expired that day
celery_app.conf.beat_schedule = {
    "renew-expired-subscriptions-daily": {
        "task": "tasks.renew_subscriptions",
        "schedule": crontab(hour=0, minute=0),
    },
}
