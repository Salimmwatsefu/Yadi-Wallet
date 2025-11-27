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
        


# --- UPDATED: Account Verification Views (Magic Link Support) ---

class SendVerificationOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Optional: Update phone number if provided
        phone = request.data.get('phone_number')
        if phone:
            user.phone_number = phone
            user.save()

        # 1. Generate OTP (Legacy/Backup)
        otp_code = user.generate_otp()
        
        # 2. Generate Signed Token (For Magic Link)
        signer = TimestampSigner()
        token = signer.sign(str(user.id))
        
        # Construct Link (Point to Frontend Route)
        # In PROD, use your actual domain from settings
        base_url = "http://localhost:5174" 
        verification_link = f"{base_url}/verify-email?token={token}"
        
        # Send Email via Celery Task
        send_email_task.delay(
            user.email,
            "Verify Your Account",
            f"""
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>Verify Your Yadi Wallet</h2>
                <p>Click the button below to verify your account immediately.</p>
                <a href="{verification_link}" style="background-color: #FF5500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 20px 0;">Verify Account</a>
                <p>Or enter this code manually: <strong>{otp_code}</strong></p>
                <p style="color: #888; font-size: 12px;">Link expires in 10 minutes.</p>
            </div>
            """
        )
        
        return Response({"status": "sent", "message": f"Verification link sent to {user.email}"})

class VerifyAccountView(APIView):
    # Allow Any because the user clicking the link might not have a session cookie yet 
    # (e.g. opened in a different browser/tab), but the token signs their ID securely.
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        token = request.data.get('token')
        otp = request.data.get('otp')
        user = request.user if request.user.is_authenticated else None

        # Scenario A: Verify via Token (Magic Link)
        if token:
            signer = TimestampSigner()
            try:
                user_id = signer.unsign(token, max_age=600) # 10 min expiry
                user_to_verify = User.objects.get(id=user_id)
                
                user_to_verify.is_kyc_verified = True
                user_to_verify.save()
                
                # Auto-login if not logged in? Optional, but good for UX.
                # For now, just return success.
                return Response({"status": "verified", "message": "Account verified successfully"})
            
            except SignatureExpired:
                return Response({"error": "Link expired"}, status=400)
            except (BadSignature, User.DoesNotExist):
                return Response({"error": "Invalid link"}, status=400)

        # Scenario B: Verify via OTP (Manual Entry)
        elif otp and user:
            if user.verify_otp(otp):
                user.is_kyc_verified = True
                user.otp_code = None
                user.save()
                return Response({"status": "verified", "message": "Account verified successfully"})
            return Response({"error": "Invalid or expired OTP"}, status=400)

        return Response({"error": "Missing token or OTP"}, status=400)