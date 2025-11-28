import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone 
from decimal import Decimal
import random
import string

class User(AbstractUser):
    """
    The Wallet User.
    Linked to the Ticket System via 'remote_ticket_user_id'.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # The 'Handshake' ID: This matches the User ID in yadi-tickets
    remote_ticket_user_id = models.UUIDField(unique=True, null=True, blank=True, db_index=True)
    
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    
    # --- KYC Fields (Tier 1 Verification) ---
    national_id_number = models.CharField(max_length=20, blank=True, null=True)
    kra_pin = models.CharField(max_length=20, blank=True, null=True)
    
    # Secure Document Storage
    id_front_image = models.ImageField(upload_to='kyc/ids/', blank=True, null=True)
    id_back_image = models.ImageField(upload_to='kyc/ids/', blank=True, null=True)
    
    is_kyc_verified = models.BooleanField(default=False)
    kyc_rejection_reason = models.TextField(blank=True, null=True)

    theme_preference = models.CharField(
        max_length=10, 
        choices=[('light', 'Light'), ('dark', 'Dark')], 
        default='light'
    )

    # --- Custom Commission Rate ---
    # Default is 4.00%. You can change this to 2.5% for specific VIP organizers.
    commission_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('4.00'),
        help_text="Percentage taken from Ticket Sales (e.g. 4.00)"
    )

    # --- OTP FIELDS ---
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    def generate_otp(self):
        code = ''.join(random.choices(string.digits, k=6))
        self.otp_code = code
        self.otp_created_at = timezone.now() 
        self.save()
        return code

    def verify_otp(self, code):
        if not self.otp_code or not self.otp_created_at:
            return False
        # Check expiry (e.g. 10 mins)
        if timezone.now() > self.otp_created_at + timezone.timedelta(minutes=10):
            return False
        return self.otp_code == code

    def __str__(self):
        return self.email or self.username