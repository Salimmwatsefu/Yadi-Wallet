from django.db import transaction
from decimal import Decimal
import uuid
from .models import Transaction, LedgerEntry, Wallet, FeeConfiguration
# IMPORT CELERY TASKS
from integrations.tasks import send_sms_task, send_email_task

class FeeService:
    @staticmethod
    def calculate_withdrawal_fees(amount):
        amount_dec = Decimal(str(amount))
        config = FeeConfiguration.objects.filter(
            min_amount__lte=amount_dec,
            max_amount__gte=amount_dec
        ).first()
        
        if config:
            return {
                "service_fee": config.service_fee,
                "network_fee": config.network_fee,
                "total_deduction": amount_dec + config.service_fee + config.network_fee
            }
        
        return {
            "service_fee": Decimal('0.00'),
            "network_fee": Decimal('0.00'),
            "total_deduction": amount_dec
        }

class LedgerService:
    @staticmethod
    @transaction.atomic
    def process_transaction(reference, description, tx_type, entries, status=Transaction.Status.COMPLETED):
        tx = Transaction.objects.create(
            reference=reference,
            transaction_type=tx_type,
            description=description,
            status=status
        )

        total_debit = Decimal('0.00')
        total_credit = Decimal('0.00')

        for entry in entries:
            wallet = Wallet.objects.select_for_update().get(id=entry['wallet'].id)
            amount = Decimal(str(entry['amount']))
            entry_type = entry['type']

            if entry_type == LedgerEntry.EntryType.DEBIT:
                total_debit += amount
                wallet.balance -= amount
                
                # --- NOTIFICATION (DEBIT) ---
                if wallet.owner:
                    # 1. SMS (Mock/Real)
                    msg = f"Debit: KES {amount:,.2f} sent. Ref: {reference}. Bal: {wallet.balance:,.2f}"
                    send_sms_task.delay(wallet.owner.phone_number, msg)
                    
                    # 2. EMAIL (Receipt) - Always send for debits
                    if wallet.owner.email:
                        email_body = f"""
                        <h3>Transaction Receipt</h3>
                        <p>You sent <b>KES {amount:,.2f}</b> from {wallet.label}.</p>
                        <p><b>Reference:</b> {reference}</p>
                        <p><b>New Balance:</b> KES {wallet.balance:,.2f}</p>
                        """
                        send_email_task.delay(wallet.owner.email, "Money Sent", email_body)

            else:
                total_credit += amount
                wallet.balance += amount
                
                # --- NOTIFICATION (CREDIT) ---
                if wallet.owner:
                    msg = f"Credit: KES {amount:,.2f} received. Ref: {reference}. Bal: {wallet.balance:,.2f}"
                    send_sms_task.delay(wallet.owner.phone_number, msg)
            
            wallet.save()

            LedgerEntry.objects.create(
                transaction=tx,
                wallet=wallet,
                amount=amount,
                entry_type=entry_type,
                balance_after=wallet.balance
            )

        if total_debit != total_credit:
            raise ValueError(f"Ledger Imbalance! Debit: {total_debit} != Credit: {total_credit}")
        
        return tx

    @staticmethod
    def execute_transfer(source_wallet, destination_wallet, amount, request_user, custom_description=None):
        amount = Decimal(str(amount))
        
        if not custom_description:
            custom_description = f"Transfer: {source_wallet.label} -> {destination_wallet.label}"
        
        # 1. LOCKED TRANSFER (Business -> Personal)
        if source_wallet.wallet_type == Wallet.Type.ORGANIZER:
            reference = f"TRF-LOCK-{uuid.uuid4().hex[:8].upper()}"
            suspense_wallet = Wallet.objects.get(wallet_type=Wallet.Type.SUSPENSE)
            
            entries = [
                {'wallet': source_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.DEBIT},
                {'wallet': suspense_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.CREDIT}
            ]
            
            tx = LedgerService.process_transaction(
                reference=reference,
                description=f"{custom_description} (Pending Approval)",
                tx_type=Transaction.Type.TRANSFER,
                entries=entries,
                status=Transaction.Status.PENDING_APPROVAL
            )
            
            # Email Alert: Pending
            if source_wallet.owner and source_wallet.owner.email:
                send_email_task.delay(
                    source_wallet.owner.email, 
                    "Transfer Pending Approval", 
                    f"Your transfer of KES {amount} requires admin approval."
                )
            
            return tx

        # 2. INSTANT TRANSFER
        else:
            reference = f"TRF-INST-{uuid.uuid4().hex[:8].upper()}"
            entries = [
                {'wallet': source_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.DEBIT},
                {'wallet': destination_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.CREDIT}
            ]
            
            tx = LedgerService.process_transaction(
                reference=reference,
                description=custom_description,
                tx_type=Transaction.Type.TRANSFER,
                entries=entries,
                status=Transaction.Status.COMPLETED
            )
            
            # P2P Specific Email to Recipient
            if destination_wallet.owner and destination_wallet.owner != request_user:
                 if destination_wallet.owner.email:
                     send_email_task.delay(
                         destination_wallet.owner.email,
                         "You Received Money!",
                         f"<h3>Good news!</h3><p>You received <b>KES {amount:,.2f}</b> from {request_user.username}.</p>"
                     )

            return tx