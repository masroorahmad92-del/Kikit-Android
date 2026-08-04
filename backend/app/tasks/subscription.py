from app.core.celery import celery_app
from app.core.logger import logger


@celery_app.task(name="tasks.renew_subscriptions")
def renew_subscriptions_task():
    """
    Periodic task: renew expired subscriptions.
    Profiles with subscription_type = None are skipped.
    calls_taken resets to 0 on each renewal.
    """
    from app.database.session import SessionLocal
    from app.repositories.profile import renew_expired_subscriptions

    db = SessionLocal()
    try:
        count = renew_expired_subscriptions(db)
        logger.info("Subscription renewal complete: %d profile(s) renewed.", count)
        return {"renewed": count}
    except Exception:
        logger.error("Subscription renewal task failed", exc_info=True)
        raise
    finally:
        db.close()
