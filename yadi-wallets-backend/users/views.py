from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.contrib.auth import login
from .models import User
from .serializers import UserProfileSerializer
from django.views.decorators.csrf import ensure_csrf_cookie 
from django.utils.decorators import method_decorator
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.oauth2.client import OAuth2Client



class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    # This callback URL must match what is set in your Google Console
    callback_url = "http://localhost:5174" 
    client_class = OAuth2Client

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET: Returns user profile (including theme).
    PATCH: Updates user profile (e.g., theme).
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class ExchangeMagicTokenView(APIView):
    """
    POST /api/users/auth/exchange/
    Exchanges a signed magic token for a real session cookie.
    """
    permission_classes = [permissions.AllowAny]
    # 1. DISABLE SESSION AUTH for this view to bypass CSRF checks
    authentication_classes = [] 

    # --- FORCE CSRF COOKIE DELIVERY ---
    @method_decorator(ensure_csrf_cookie)
    def post(self, request):
        
        token = request.data.get('token')

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token required"}, status=400)

        signer = TimestampSigner()
        try:
            # 2. Verify Signature & Age (Max 5 minutes)
            user_id = signer.unsign(token, max_age=300)
            
            # 3. Get User
            user = User.objects.get(id=user_id)
            
            if not user.is_active:
                return Response({"error": "Account disabled"}, status=403)
                
            # 4. Login (Create Session)
            # Use request._request to ensure compatibility with DRF
            login(request, user)
            
            return Response({
                "status": "success",
                "user": UserProfileSerializer(user).data
            })

        except SignatureExpired:
            return Response({"error": "Link expired. Please try again from the dashboard."}, status=403)
        except (BadSignature, User.DoesNotExist):
            return Response({"error": "Invalid link."}, status=403)