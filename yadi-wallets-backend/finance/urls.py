from django.urls import path
from .views import InitiateWithdrawalView, MyWalletView

urlpatterns = [
    path('withdraw/', InitiateWithdrawalView.as_view(), name='withdraw-funds'),
    path('me/', MyWalletView.as_view(), name='my-wallet')
]