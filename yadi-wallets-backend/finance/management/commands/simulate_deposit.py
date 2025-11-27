from django.core.management.base import BaseCommand
from users.models import User
from finance.models import Wallet, LedgerEntry, Transaction
from django.db import transaction
from decimal import Decimal
import uuid

class Command(BaseCommand):
    help = 'Simulates an M-Pesa Deposit for testing purposes'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User Email')
        parser.add_argument('amount', type=float, help='Amount to Deposit')

    def handle(self, *args, **kwargs):
        email = kwargs['email']
        amount = Decimal(str(kwargs['amount']))

        try:
            user = User.objects.get(email=email)
            # Find their primary customer wallet
            wallet = Wallet.objects.filter(owner=user, wallet_type=Wallet.Type.CUSTOMER).first()
            
            if not wallet:
                self.stdout.write(self.style.ERROR(f"User {email} has no Personal Wallet!"))
                return

            master_wallet = Wallet.objects.get(wallet_type=Wallet.Type.MASTER_LIQUIDITY)

            with transaction.atomic():
                # Simulate Money entering the system (Debit Liquidity, Credit User)
                # In real life, M-Pesa sends money to Master.
                # Ledger: Debit MASTER (Asset Up) -> Credit USER (Liability Up)
                
                ref = f"SIM-{uuid.uuid4().hex[:8].upper()}"
                
                entries = [
                    {'wallet': master_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.DEBIT},
                    {'wallet': wallet, 'amount': amount, 'type': LedgerEntry.EntryType.CREDIT}
                ]

                # Create Transaction
                tx = Transaction.objects.create(
                    reference=ref,
                    transaction_type=Transaction.Type.DEPOSIT,
                    description="Simulated M-Pesa Deposit",
                    status=Transaction.Status.COMPLETED
                )

                # Execute Ledger
                master_wallet.balance += amount
                master_wallet.save()
                
                wallet.balance += amount
                wallet.save()

                LedgerEntry.objects.create(transaction=tx, wallet=master_wallet, amount=amount, entry_type=LedgerEntry.EntryType.DEBIT, balance_after=master_wallet.balance)
                LedgerEntry.objects.create(transaction=tx, wallet=wallet, amount=amount, entry_type=LedgerEntry.EntryType.CREDIT, balance_after=wallet.balance)

            self.stdout.write(self.style.SUCCESS(f"✅ Successfully deposited KES {amount} to {email}"))
            self.stdout.write(self.style.SUCCESS(f"   New Balance: KES {wallet.balance}"))

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User {email} not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))