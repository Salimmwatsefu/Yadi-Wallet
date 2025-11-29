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
from integrations.tasks import send_email_task
from django.conf import settings



class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    @property
    def callback_url(self):
        return "http://localhost:5174" if settings.DEBUG else "https://wallets.yadi.app"

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
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            
            login(request, user)
            
            return Response({
                "status": "success",
                "user": UserProfileSerializer(user).data
            })

        except SignatureExpired:
            return Response({"error": "Link expired. Please try again from the dashboard."}, status=403)
        except (BadSignature, User.DoesNotExist):
            return Response({"error": "Invalid link."}, status=403)
        


# --- UPDATED: Account Verification Views  ---


class SendVerificationOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Optional: Update phone number if provided
        phone = request.data.get('phone_number')
        if phone:
            user.phone_number = phone
            user.save()

        # 1. Generate OTP Only
        otp_code = user.generate_otp()
        
        # 2. Send Email (OTP Only - No Link)
        send_email_task.delay(
            user.email,
            "Verify Your Account",
            f"""
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>Verify Your Yadi Wallet</h2>
                <p>Please enter the code below to verify your account.</p>
                <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    {otp_code}
                </div>
                <p style="color: #888; font-size: 12px;">This code expires in 10 minutes.</p>
            </div>
            """
        )
        
        return Response({"status": "sent", "message": f"OTP sent to {user.email}"})

class VerifyAccountView(APIView):
    # use auth
    # Since we aren't using magic links, the user must be logged in to verify.
    permission_classes = [permissions.IsAuthenticated] 

    def post(self, request):
        otp = request.data.get('otp')
        user = request.user

        if not otp:
            return Response({"error": "OTP is required"}, status=400)

        # Verify OTP
        if user.verify_otp(otp):
            user.is_kyc_verified = True
            user.otp_code = None # Clear OTP after use
            user.save()
            return Response({"status": "verified", "message": "Account verified successfully"})
            
        return Response({"error": "Invalid or expired OTP"}, status=400)