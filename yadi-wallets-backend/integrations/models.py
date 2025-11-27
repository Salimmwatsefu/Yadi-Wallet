import uuid
import secrets
from django.db import models

class ServiceClient(models.Model):
    """
    Represents a trusted external service (e.g., 'Yadi Tickets Backend').
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    api_key = models.CharField(max_length=64, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = f"sk_live_{secrets.token_urlsafe(32)}"
        super().save(*args, **kwargs)

    @property
    def is_authenticated(self):
        """Always return True. If this object exists in request.user, it is authenticated."""
        return True

    def __str__(self):
        return self.name