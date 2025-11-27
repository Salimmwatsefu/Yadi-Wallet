from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import ServiceClient

class ServiceKeyAuthentication(BaseAuthentication):
    """
    Authenticates server-to-server requests using a secret API Key.
    Header: X-Service-Key: sk_live_...
    """
    def authenticate(self, request):
        api_key = request.headers.get('X-Service-Key')
        
        if not api_key:
            return None # Pass to next auth method (e.g., Session) if no key provided

        try:
            client = ServiceClient.objects.get(api_key=api_key, is_active=True)
        except ServiceClient.DoesNotExist:
            raise AuthenticationFailed('Invalid or inactive Service Key')

        # Return (User, Auth) tuple. 
        # We return the ServiceClient as the "User" context for these requests.
        return (client, None)