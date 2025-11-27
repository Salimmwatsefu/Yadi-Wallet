import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Toggle: Choose your provider here. 
# In production, set SMS_PROVIDER='MOBITECH' in your .env / settings.py
SMS_PROVIDER = getattr(settings, 'SMS_PROVIDER', 'MOCK') 

class NotificationService:
    """
    Central hub for sending SMS and Email.
    Supports Mobitech (Primary), Africa's Talking (Backup), and Mock Mode.
    """

    @staticmethod
    def send_sms(phone_number, message):
        """
        Routes the SMS to the configured provider.
        """
        if not phone_number:
            logger.warning("NotificationService: No phone number provided.")
            return False
            
        # Normalize phone to 2547... format
        # Mobitech and AT both prefer international format without the plus for some endpoints,
        # or with it. Standardizing to '2547...' is safest for local APIs often.
        clean_phone = phone_number
        if clean_phone.startswith('0'):
            clean_phone = '254' + clean_phone[1:]
        elif clean_phone.startswith('+'):
            clean_phone = clean_phone[1:]
        
        # 1. MOCK MODE (Free Dev)
        if SMS_PROVIDER == 'MOCK':
            print(f"\n📱 [MOCK SMS] --------------------------------")
            print(f"To: {clean_phone}")
            print(f"Message: {message}")
            print(f"----------------------------------------------\n")
            return True

        # 2. MOBITECH (Your Primary Choice)
        elif SMS_PROVIDER == 'MOBITECH':
            return NotificationService._send_mobitech(clean_phone, message)

        # 3. AFRICA'S TALKING (Backup Option)
        elif SMS_PROVIDER == 'AFRICASTALKING':
            # AT usually requires the '+'
            return NotificationService._send_africastalking(f"+{clean_phone}", message)

        logger.error(f"Unknown SMS_PROVIDER: {SMS_PROVIDER}")
        return False

    @staticmethod
    def _send_mobitech(phone, message):
        """
        Sends SMS via Mobitech API.
        Docs: https://mobitechtechnologies.com/api-documentation
        """
        url = "https://api.mobitechtechnologies.com/sms/sendsms"
        
        payload = {
            "mobile": phone,
            "response_type": "json",
            "sender_name": getattr(settings, 'MOBITECH_SENDER_ID', '23107'), 
            "service_id": 0, 
            "message": message
        }
        
        headers = {
            "h_api_key": getattr(settings, 'MOBITECH_API_KEY', ''),
            "Content-Type": "application/json"
        }
        
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            res.raise_for_status()
            
            # Mobitech returns a list of dicts: [{"status_code":"1000",...}]
            response_data = res.json()
            
            if isinstance(response_data, list) and len(response_data) > 0:
                status_code = response_data[0].get('status_code')
                if status_code == '1000':
                    logger.info(f"Mobitech SMS sent to {phone}")
                    return True
                else:
                    logger.error(f"Mobitech API Error: {response_data}")
                    return False
            
            # Fallback if response format is unexpected
            logger.error(f"Mobitech Unexpected Response: {response_data}")
            return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Mobitech Connection Error: {e}")
            return False
        except Exception as e:
            logger.error(f"Mobitech General Error: {e}")
            return False

    @staticmethod
    def _send_africastalking(phone, message):
        """
        Sends SMS via Africa's Talking API.
        """
        url = "https://api.africastalking.com/version1/messaging"
        headers = {
            "ApiKey": getattr(settings, 'AFRICASTALKING_API_KEY', ''),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        data = {
            "username": getattr(settings, 'AFRICASTALKING_USERNAME', 'sandbox'),
            "to": phone,
            "message": message
        }
        try:
            res = requests.post(url, headers=headers, data=data, timeout=10)
            res.raise_for_status()
            logger.info(f"AT SMS sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"AT SMS Failed: {e}")
            return False

    @staticmethod
    def send_email(to_email, subject, html_content, text_content=None):
        """
        Sends Email via Brevo (Sendinblue).
        """
        if not to_email:
            return False

        # Mock Mode for Email
        if settings.DEBUG and getattr(settings, 'EMAIL_PROVIDER', 'MOCK') == 'MOCK': 
             print(f"\n📧 [MOCK EMAIL] ------------------------------")
             print(f"To: {to_email} | Subject: {subject}")
             print(f"----------------------------------------------\n")
             return True
        
        # Real Brevo Logic
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": getattr(settings, 'BREVO_API_KEY', ''),
            "content-type": "application/json"
        }
        
        payload = {
            "sender": {"name": "Yadi Wallet", "email": "no-reply@yadi.app"},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        if text_content:
            payload['textContent'] = text_content

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            res.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Brevo Email Failed: {e}")
            return False