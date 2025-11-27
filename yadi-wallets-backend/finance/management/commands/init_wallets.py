from django.core.management.base import BaseCommand
from finance.models import Wallet, Currency

class Command(BaseCommand):
    help = 'Initializes the Master and Revenue Wallets'

    def handle(self, *args, **kwargs):
        # 1. Ensure Currency Exists
        kes, created = Currency.objects.get_or_create(
            code='KES',
            defaults={'name': 'Kenyan Shilling', 'symbol': 'KSh'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created Currency: {kes}"))

        # 2. Create Master Liquidity Wallet (The Physical Bank Mirror)
        master_wallet, created = Wallet.objects.get_or_create(
            wallet_type=Wallet.Type.MASTER_LIQUIDITY,
            currency=kes,
            defaults={
                'owner': None, # System owned
                'balance': 0.00
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created MASTER Wallet: {master_wallet.id}"))
        else:
            self.stdout.write(self.style.WARNING(f"MASTER Wallet already exists: {master_wallet.id}"))

        # 3. Create Revenue Wallet (Your Profit)
        revenue_wallet, created = Wallet.objects.get_or_create(
            wallet_type=Wallet.Type.REVENUE,
            currency=kes,
            defaults={
                'owner': None, # System owned
                'balance': 0.00
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created REVENUE Wallet: {revenue_wallet.id}"))
        else:
            self.stdout.write(self.style.WARNING(f"REVENUE Wallet already exists: {revenue_wallet.id}"))



        # 4. Create Suspense Wallet (Waiting Room)
        suspense_wallet, created = Wallet.objects.get_or_create(
            wallet_type=Wallet.Type.SUSPENSE,
            currency=kes,
            defaults={'owner': None, 'balance': 0.00}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created SUSPENSE Wallet: {suspense_wallet.id}"))