from celery import shared_task
from .notifications import NotificationService
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_sms_task(self, phone_number, message):
    """
    Background task for SMS. 
    If SMS_PROVIDER is 'MOCK', this just logs to console (Free).
    """
    try:
        # This will use your NotificationService logic (Mock or Real)
        success = NotificationService.send_sms(phone_number, message)
        if not success:
            logger.warning(f"SMS Task reported failure for {phone_number}")
            return "Failed"
        return "Sent"
    except Exception as exc:
        logger.error(f"SMS Task Exception: {exc}")
        # Retry in 60s if it crashes
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def send_email_task(self, to_email, subject, html_content):
    """
    Background task for Emails via Brevo.
    """
    try:
        success = NotificationService.send_email(to_email, subject, html_content)
        if not success:
            logger.warning(f"Email Task reported failure for {to_email}")
            return "Failed"
        return "Sent"
    except Exception as exc:
        logger.error(f"Email Task Exception: {exc}")
        raise self.retry(exc=exc)