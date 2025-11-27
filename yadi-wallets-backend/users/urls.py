from django.urls import path
from .views import ExchangeMagicTokenView, UserProfileView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    path('auth/exchange/', ExchangeMagicTokenView.as_view(), name='auth-exchange'),
]