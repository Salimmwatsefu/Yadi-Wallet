from django.urls import path
from .views import ExchangeMagicTokenView, SendVerificationOTPView, UserProfileView, VerifyAccountView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    path('auth/exchange/', ExchangeMagicTokenView.as_view(), name='auth-exchange'),

    path('verify/send-otp/', SendVerificationOTPView.as_view(), name='send-otp'),
    path('verify/confirm/', VerifyAccountView.as_view(), name='confirm-otp'),
]