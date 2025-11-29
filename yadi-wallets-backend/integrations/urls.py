from django.urls import path
from .views import CollectPaymentView, GenerateMagicLinkView, OnboardUserView, ServiceBalanceView, ServiceHistoryView, ServiceWithdrawalView



print("=" * 50)
print("INTEGRATIONS URLS LOADING")
print("=" * 50)

urlpatterns = [
    path('onboard/', OnboardUserView.as_view(), name='service-onboard'),
    path('balance/<uuid:remote_id>/', ServiceBalanceView.as_view()),
    path('payment/collect/', CollectPaymentView.as_view(), name='service-collect-payment'),

    path('withdraw/', ServiceWithdrawalView.as_view(), name='service-withdraw'),

    path('auth/link/', GenerateMagicLinkView.as_view(), name='service-magic-link'),

    path('history/<uuid:remote_id>/', ServiceHistoryView.as_view(), name='service-history'),
]


print("URL patterns:", [str(p.pattern) for p in urlpatterns])
print("=" * 50)