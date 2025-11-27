from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from users.models import User
from finance.models import Wallet, Currency

class WalletSocialAdapter(DefaultSocialAccountAdapter):
    def save_user(self, request, sociallogin, form=None):
        # 1. Create the User standard way
        user = super().save_user(request, sociallogin, form)
        
        # 2. Check Wallets
        currency, _ = Currency.objects.get_or_create(code='KES', defaults={'name': 'Shilling', 'symbol': 'KSh'})
        
        # If they already have an ORGANIZER wallet (from Ticket App handshake), 
        # we DO NOT create a Customer wallet automatically (optional choice).
        # BUT, based on your requirement "Direct signups get Customer Wallet":
        
        if not Wallet.objects.filter(owner=user).exists():
            print(f"👤 Direct Signup: Creating PERSONAL wallet for {user.email}")
            Wallet.objects.create(
                owner=user,
                wallet_type=Wallet.Type.CUSTOMER, # Personal Account
                currency=currency
            )
        
        return user

    def pre_social_login(self, request, sociallogin):
        # 3. Connect to existing email if it exists (Smart Merge)
        email = sociallogin.account.extra_data.get('email')
        if not email:
            return

        try:
            user = User.objects.get(email=email)
            if not sociallogin.is_existing:
                sociallogin.connect(request, user)
        except User.DoesNotExist:
            pass