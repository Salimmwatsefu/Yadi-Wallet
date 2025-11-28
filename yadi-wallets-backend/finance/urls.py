from django.urls import path
from .views import TransactionHistoryView, WalletManagementView, TransferFundsView, InitiateWithdrawalView

urlpatterns = [
    
    
    # New Multi-Wallet Endpoints
    path('wallets/', WalletManagementView.as_view(), name='wallet-list'),
    path('transfer/', TransferFundsView.as_view(), name='wallet-transfer'),
    path('withdraw/', InitiateWithdrawalView.as_view(), name='withdraw-funds'),
    path('history/', TransactionHistoryView.as_view(), name='transaction-history'),
    
]