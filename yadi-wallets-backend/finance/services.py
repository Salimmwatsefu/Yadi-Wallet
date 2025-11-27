from django.db import transaction
from decimal import Decimal
from .models import Transaction, LedgerEntry, Wallet

class LedgerService:
    @staticmethod
    @transaction.atomic
    def process_transaction(reference, description, tx_type, entries):
        """
        Atomically processes a transaction.
        entries = [
            {'wallet': wallet_obj, 'amount': 1000, 'type': 'DEBIT'},
            {'wallet': wallet_obj, 'amount': 1000, 'type': 'CREDIT'},
        ]
        """
        # 1. Create the Transaction Record
        tx = Transaction.objects.create(
            reference=reference,
            transaction_type=tx_type,
            description=description,
            status=Transaction.Status.PENDING
        )

        total_debit = Decimal('0.00')
        total_credit = Decimal('0.00')


        # 2. Process Entries
        for entry in entries:
            wallet_id = entry['wallet'].id  
            
           
            wallet = Wallet.objects.select_for_update().get(id=wallet_id)
            
            amount = Decimal(str(entry['amount']))
            entry_type = entry['type']

            

            if entry_type == LedgerEntry.EntryType.DEBIT:
                total_debit += amount
                wallet.balance -= amount
            else:
                total_credit += amount
                wallet.balance += amount
            
            wallet.save()

            LedgerEntry.objects.create(
                transaction=tx,
                wallet=wallet,
                amount=amount,
                entry_type=entry_type,
                balance_after=wallet.balance
            )

        # 3. Integrity Check (Zero-Sum Game)
        if total_debit != total_credit:
            raise ValueError(f"Ledger Imbalance! Debit: {total_debit} != Credit: {total_credit}")

        tx.status = Transaction.Status.COMPLETED
        tx.save()
        
        return tx