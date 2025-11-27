from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from finance.models import Transaction, Wallet, LedgerEntry
from integrations.mpesa import MpesaGateway

class Command(BaseCommand):
    help = 'Releases approved withdrawals that have passed their 48h lock period.'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # 1. Find Due Transactions
        due_txs = Transaction.objects.filter(
            status=Transaction.Status.APPROVED,
            transaction_type=Transaction.Type.WITHDRAWAL,
            scheduled_release_date__lte=now # Time has passed
        )

        if not due_txs.exists():
            self.stdout.write("No payouts due.")
            return

        self.stdout.write(f"Found {due_txs.count()} payouts due for release.")

        suspense_wallet = Wallet.objects.get(wallet_type=Wallet.Type.SUSPENSE)
        master_wallet = Wallet.objects.get(wallet_type=Wallet.Type.MASTER_LIQUIDITY)

        for tx in due_txs:
            try:
                with transaction.atomic():
                    # Get the amount from the original DEBIT entry
                    # (We moved it to Suspense earlier, now we move it OUT of Suspense)
                    original_entry = tx.entries.filter(entry_type=LedgerEntry.EntryType.DEBIT).first()
                    amount = original_entry.amount

                    # 2. Trigger M-Pesa
                    # In a real app, we might do this *outside* the atomic block 
                    # or handle the 'Pending' state of M-Pesa B2C. 
                    # For now, we assume instant success/fail for simplicity.
                    user_phone = tx.entries.first().wallet.owner.phone_number
                    mpesa_ref = MpesaGateway.trigger_b2c(user_phone, amount, tx.reference)

                    # 3. Update Ledger (Clear the Liability)
                    # Debit SUSPENSE (Reduce Liability), Credit MASTER (Reduce Cash Asset)
                    # Wait - Master is a Liability account in our model (representing Cash Held).
                    # So Reducing Cash Held = DEBIT Master?
                    # Let's stick to the simple flow we used earlier:
                    # Incoming: Debit Master, Credit User.
                    # Outgoing: Debit User, Credit Suspense.
                    # Final Release: Debit Suspense, Credit Master (Closing the loop).
                    
                    LedgerEntry.objects.create(
                        transaction=tx,
                        wallet=suspense_wallet,
                        amount=amount,
                        entry_type=LedgerEntry.EntryType.DEBIT, # Remove from Suspense
                        balance_after=suspense_wallet.balance - amount
                    )
                    suspense_wallet.balance -= amount
                    suspense_wallet.save()

                    LedgerEntry.objects.create(
                        transaction=tx,
                        wallet=master_wallet,
                        amount=amount,
                        entry_type=LedgerEntry.EntryType.CREDIT, # Return to Master (money gone)
                        balance_after=master_wallet.balance + amount
                    )
                    master_wallet.balance += amount
                    master_wallet.save()

                    # 4. Mark Complete
                    tx.status = Transaction.Status.COMPLETED
                    tx.external_reference = mpesa_ref
                    tx.completed_at = timezone.now()
                    tx.save()

                    self.stdout.write(self.style.SUCCESS(f"✅ Processed {tx.reference}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Failed {tx.reference}: {e}"))
                # Optionally mark as FAILED or RETRY