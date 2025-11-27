from django.core.management.base import BaseCommand
from finance.models import Wallet, Currency

class Command(BaseCommand):
    help = 'Initializes the System Wallets (Liquidity, Revenue, Settlement, etc.)'

    def handle(self, *args, **kwargs):
        # 1. Ensure Currency Exists
        kes, created = Currency.objects.get_or_create(
            code='KES',
            defaults={'name': 'Kenyan Shilling', 'symbol': 'KSh'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created Currency: {kes}"))

        # Helper to create system wallet
        def create_system_wallet(w_type, label):
            wallet, created = Wallet.objects.get_or_create(
                wallet_type=w_type,
                currency=kes,
                defaults={
                    'owner': None, # System owned
                    'balance': 0.00,
                    'label': label
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created {label} ({w_type})"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️  Exists: {label}"))

        # 2. Create the Fleet
        create_system_wallet(Wallet.Type.MASTER_LIQUIDITY, "Master Liquidity (Paybill)")
        create_system_wallet(Wallet.Type.SETTLEMENT, "Settlement (Incoming)")
        create_system_wallet(Wallet.Type.REVENUE, "Yadi Revenue (Profit)")
        create_system_wallet(Wallet.Type.SUSPENSE, "Suspense (Payout Lock)")
        create_system_wallet(Wallet.Type.RESERVE, "Reserve (Bank Vault)")