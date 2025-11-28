from django.core.management.base import BaseCommand
from users.models import User
from finance.models import Wallet, LedgerEntry, Transaction
from django.db import transaction
from decimal import Decimal
import uuid

class Command(BaseCommand):
    help = 'Simulates a normal user deposit (Personal Wallet)'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User Email')
        parser.add_argument('amount', type=float, help='Amount to Deposit')

    def handle(self, *args, **kwargs):
        email = kwargs['email']
        amount = Decimal(str(kwargs['amount']))

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User {email} not found"))
            return

        # Ensure MASTER_LIQUIDITY exists
        master_wallet, _ = Wallet.objects.get_or_create(wallet_type=Wallet.Type.MASTER_LIQUIDITY, defaults={'balance': 0})

        # Ensure user's personal wallet exists
        user_wallet, _ = Wallet.objects.get_or_create(owner=user, wallet_type=Wallet.Type.CUSTOMER, defaults={'balance': 0})

        with transaction.atomic():
            ref = f"SIM-{uuid.uuid4().hex[:8].upper()}"

            # Update balances
            master_wallet.balance += amount
            master_wallet.save()

            user_wallet.balance += amount
            user_wallet.save()

            # Create Transaction
            tx = Transaction.objects.create(
                reference=ref,
                transaction_type=Transaction.Type.DEPOSIT,
                description="Simulated Personal Wallet Deposit",
                status=Transaction.Status.COMPLETED
            )

            # Ledger entries
            LedgerEntry.objects.create(
                transaction=tx,
                wallet=master_wallet,
                amount=amount,
                entry_type=LedgerEntry.EntryType.DEBIT,
                balance_after=master_wallet.balance
            )
            LedgerEntry.objects.create(
                transaction=tx,
                wallet=user_wallet,
                amount=amount,
                entry_type=LedgerEntry.EntryType.CREDIT,
                balance_after=user_wallet.balance
            )

        self.stdout.write(self.style.SUCCESS(f"✅ Successfully deposited KES {amount} to {email}"))
        self.stdout.write(self.style.SUCCESS(f"   New Balance: KES {user_wallet.balance}"))
