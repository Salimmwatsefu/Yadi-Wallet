import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

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

    def __str__(self):
        return self.email or self.username