from django.urls import path
from .views import CollectPaymentView, GenerateMagicLinkView, OnboardUserView, ServiceBalanceView, ServiceHistoryView, ServiceWithdrawalView

urlpatterns = [
    path('service/onboard/', OnboardUserView.as_view(), name='service-onboard'),
    path('service/balance/<uuid:remote_id>/', ServiceBalanceView.as_view()),
    path('service/payment/collect/', CollectPaymentView.as_view(), name='service-collect-payment'),

    path('service/withdraw/', ServiceWithdrawalView.as_view(), name='service-withdraw'),

    path('service/auth/link/', GenerateMagicLinkView.as_view(), name='service-magic-link'),

    path('service/history/<uuid:remote_id>/', ServiceHistoryView.as_view(), name='service-history'),
]