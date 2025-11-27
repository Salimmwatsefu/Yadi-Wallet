import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db import transaction
from decimal import Decimal
from .models import Wallet, LedgerEntry, Transaction
from .services import LedgerService
from integrations.mpesa import MpesaGateway
from django.db.models import Sum

class InitiateWithdrawalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1. Get Data
        user = request.user
        amount = Decimal(request.data.get('amount', '0'))
        
        if amount <= 0:
            return Response({"error": "Invalid amount"}, status=400)

        # 2. Get User's Wallet
        try:
            # Assuming organizers operate in KES
            wallet = user.wallets.get(wallet_type=Wallet.Type.ORGANIZER, currency__code='KES')
        except Wallet.DoesNotExist:
            return Response({"error": "Wallet not found"}, status=404)

        # 3. Validation (KYC & Balance)
        # Strict Mode: Uncomment this when you want to enforce KYC
        # if not user.is_kyc_verified:
        #     return Response({"error": "Account not verified. Please upload ID."}, status=403)

        if wallet.balance < amount:
            return Response({"error": "Insufficient funds"}, status=400)

        try:
            # 4. ATOMIC TRANSACTION (The Magic)
            # We wrap the Logic + Ledger + M-Pesa Trigger in one block (conceptually)
            # Note: We actually deduct FIRST, then try to send. If M-Pesa fails, we refund.
            
            reference = f"WD-{uuid.uuid4().hex[:8].upper()}"
            
            # Prepare Ledger Entries
            # Debit Organizer Wallet (-), Credit Master Liquidity (+) (Money leaves the system via Master)
            master_wallet = Wallet.objects.get(wallet_type=Wallet.Type.MASTER_LIQUIDITY, currency__code='KES')
            
            entries = [
                {
                    'wallet': wallet,
                    'amount': amount,
                    'type': LedgerEntry.EntryType.DEBIT # Take from User
                },
                {
                    'wallet': master_wallet,
                    'amount': amount,
                    'type': LedgerEntry.EntryType.CREDIT # Return to Master (to be paid out)
                }
            ]

            # 5. Execute Ledger (This locks the funds immediately)
            tx = LedgerService.process_transaction(
                reference=reference,
                description=f"Withdrawal to {user.phone_number}",
                tx_type=Transaction.Type.WITHDRAWAL,
                entries=entries
            )

            # 6. Trigger M-Pesa B2C
            mpesa_ref = MpesaGateway.trigger_b2c(user.phone_number, amount, reference)
            
            # Update Transaction with external ref
            tx.external_reference = mpesa_ref
            tx.status = Transaction.Status.COMPLETED
            tx.save()

            return Response({
                "status": "success",
                "new_balance": wallet.balance,
                "reference": reference
            })

        except Exception as e:
            print(f"Withdrawal Error: {e}")
            return Response({"error": "System Error processing withdrawal"}, status=500)
        





class MyWalletView(APIView):
    """
    GET /api/finance/me/
    Returns the logged-in user's wallet balance and history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Get the Wallet (Prioritize Organizer, fallback to Customer)
            # This handles the "Dual Identity" logic
            wallet = Wallet.objects.filter(owner=request.user).order_by('wallet_type').first()
            
            if not wallet:
                return Response({"balance": 0, "currency": "KES", "history": []})

            # 2. Calculate Pending (Suspense)
            pending_amount = LedgerEntry.objects.filter(
                wallet=wallet,
                transaction__status__in=[
                    Transaction.Status.PENDING_APPROVAL, 
                    Transaction.Status.APPROVED, 
                    Transaction.Status.ON_HOLD
                ],
                entry_type=LedgerEntry.EntryType.DEBIT
            ).aggregate(Sum('amount'))['amount__sum'] or 0

            # 3. Get History
            entries = LedgerEntry.objects.filter(wallet=wallet).select_related('transaction').order_by('-created_at')[:10]
            history = []
            for entry in entries:
                tx = entry.transaction
                sign = 1 if entry.entry_type == LedgerEntry.EntryType.CREDIT else -1
                history.append({
                    "id": str(tx.id),
                    "type": tx.transaction_type,
                    "amount": float(entry.amount) * sign,
                    "status": tx.status,
                    "reference": tx.reference,
                    "date": entry.created_at.strftime("%Y-%m-%d %H:%M")
                })

            return Response({
                "balance": wallet.balance,
                "pending": pending_amount,
                "currency": wallet.currency.code,
                "is_frozen": wallet.is_frozen,
                "wallet_type": wallet.wallet_type, # Useful for UI
                "history": history
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)