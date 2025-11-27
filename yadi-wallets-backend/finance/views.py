from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from decimal import Decimal
from django.db.models import Sum, Q
from .models import Wallet, LedgerEntry, Transaction
from .services import LedgerService, FeeService
from integrations.mpesa import MpesaGateway
from users.models import User
import uuid

# --- 1. WALLET MANAGEMENT (Create & List) ---
class WalletManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Returns grouped wallets: 'business' and 'personal'"""
        wallets = Wallet.objects.filter(owner=request.user)
        
        business = wallets.filter(wallet_type=Wallet.Type.ORGANIZER)
        personal = wallets.filter(wallet_type=Wallet.Type.CUSTOMER)

        def serialize(qs):
            return [{
                "id": str(w.id), 
                "label": w.label, 
                "balance": w.balance, 
                "currency": w.currency.code,
                "is_primary": w.is_primary,
                "is_frozen": w.is_frozen
            } for w in qs]

        return Response({
            "business_wallets": serialize(business),
            "personal_wallets": serialize(personal)
        })

    def post(self, request):
        """Create a new Custom Goal Wallet (Personal Only)"""
        label = request.data.get('label', 'New Wallet')
        
        # Get default currency (KES)
        currency = Wallet.objects.filter(wallet_type=Wallet.Type.MASTER_LIQUIDITY).first().currency

        # Limit: Max 5 personal wallets to prevent spam
        if Wallet.objects.filter(owner=request.user, wallet_type=Wallet.Type.CUSTOMER).count() >= 5:
            return Response({"error": "Wallet limit reached (Max 5)"}, status=400)

        wallet = Wallet.objects.create(
            owner=request.user,
            wallet_type=Wallet.Type.CUSTOMER,
            label=label,
            currency=currency
        )
        return Response({
            "status": "created", 
            "id": str(wallet.id), 
            "label": wallet.label,
            "balance": 0.00
        }, status=201)

# --- 2. TRANSFER FUNDS (Inter-Wallet & P2P) ---
class TransferFundsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        source_id = request.data.get('source_wallet_id')
        dest_id = request.data.get('dest_wallet_id') # Used for Internal
        recipient_id = request.data.get('recipient_identifier') # Used for P2P
        amount = Decimal(request.data.get('amount', '0'))

        if amount <= 0:
            return Response({"error": "Invalid amount"}, status=400)

        try:
            # 1. Resolve Source Wallet (Must belong to Sender)
            source = Wallet.objects.get(id=source_id, owner=request.user)
            
            if source.balance < amount:
                return Response({"error": "Insufficient funds"}, status=400)

            dest = None
            description = ""

            # 2. Resolve Destination (Two Paths)
            
            # PATH A: Peer-to-Peer (P2P)
            if recipient_id:
                # Normalize identifier (strip spaces)
                recipient_id = recipient_id.strip()
                
                # Find User by Email OR Phone
                recipient_user = User.objects.filter(
                    Q(email__iexact=recipient_id) | Q(phone_number=recipient_id)
                ).first()

                if not recipient_user:
                    return Response({"error": f"User '{recipient_id}' not found"}, status=404)
                
                if recipient_user == request.user:
                    return Response({"error": "For self-transfers, use the 'Between My Wallets' option"}, status=400)

                # Find their Primary Customer Wallet (or fallback to first found)
                dest = Wallet.objects.filter(
                    owner=recipient_user, 
                    wallet_type=Wallet.Type.CUSTOMER
                ).order_by('-is_primary', 'created_at').first()

                if not dest:
                    return Response({"error": "Recipient has no active wallet to receive funds"}, status=400)
                
                description = f"Sent to {recipient_user.username} ({recipient_id})"

            # PATH B: Internal Transfer
            elif dest_id:
                dest = Wallet.objects.get(id=dest_id, owner=request.user)
                description = f"Internal: {source.label} -> {dest.label}"
            
            else:
                return Response({"error": "Destination required"}, status=400)

            # 3. Execute Transfer
            tx = LedgerService.execute_transfer(
                source_wallet=source, 
                destination_wallet=dest, 
                amount=amount, 
                request_user=request.user,
                custom_description=description
            )

            return Response({
                "status": tx.status,
                "message": "Transfer successful" if tx.status == 'COMPLETED' else "Transfer pending approval",
                "reference": tx.reference,
                "new_balance": source.balance
            })

        except Wallet.DoesNotExist:
            return Response({"error": "Source wallet not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# --- 3. EXTERNAL WITHDRAWAL (M-Pesa) ---
class InitiateWithdrawalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = Decimal(request.data.get('amount', '0'))
        source_id = request.data.get('source_wallet_id')
        
        # Optional: Send to someone else (Remittance)
        recipient = request.data.get('recipient_phone', request.user.phone_number)

        # 1. KYC CHECK (Blocking Rule)
        if not request.user.is_kyc_verified:
             return Response({
                 "error": "Identity verification required for withdrawals.",
                 "code": "KYC_BLOCK"
             }, status=403)

        try:
            wallet = Wallet.objects.get(id=source_id, owner=request.user)
            
            # 2. FEE ENGINE
            fees = FeeService.calculate_withdrawal_fees(amount)
            total_deduction = fees['total_deduction']

            if wallet.balance < total_deduction:
                return Response({
                    "error": f"Insufficient funds. You need KES {total_deduction} (Includes fees)",
                    "breakdown": fees
                }, status=400)
            
            # 3. CHECK WALLET TYPE RULES
            # If Organizer Wallet -> It must go to Suspense (Approval)
            if wallet.wallet_type == Wallet.Type.ORGANIZER:
                reference = f"WD-ORG-{uuid.uuid4().hex[:8].upper()}"
                suspense_wallet = Wallet.objects.get(wallet_type=Wallet.Type.SUSPENSE)
                
                entries = [
                    {'wallet': wallet, 'amount': total_deduction, 'type': LedgerEntry.EntryType.DEBIT},
                    {'wallet': suspense_wallet, 'amount': total_deduction, 'type': LedgerEntry.EntryType.CREDIT}
                ]
                
                LedgerService.process_transaction(
                    reference=reference,
                    description=f"Withdrawal Request to {recipient}",
                    tx_type=Transaction.Type.WITHDRAWAL,
                    entries=entries,
                    status=Transaction.Status.PENDING_APPROVAL
                )
                return Response({"status": "pending_approval", "message": "Withdrawal pending admin review."})

            # 4. INSTANT WITHDRAWAL (Personal Wallet)
            # Move: User -> Master (Cash Out) + Revenue (Fee)
            else:
                reference = f"WD-P-{uuid.uuid4().hex[:8].upper()}"
                master_wallet = Wallet.objects.get(wallet_type=Wallet.Type.MASTER_LIQUIDITY)
                revenue_wallet = Wallet.objects.get(wallet_type=Wallet.Type.REVENUE)
                
                entries = [
                    # Debit User Full Amount
                    {'wallet': wallet, 'amount': total_deduction, 'type': LedgerEntry.EntryType.DEBIT},
                    
                    # Credit Master (The Cash sent to user)
                    {'wallet': master_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.CREDIT},
                    
                    # Credit Master (The Network Fee Safaricom took)
                    {'wallet': master_wallet, 'amount': fees['network_fee'], 'type': LedgerEntry.EntryType.CREDIT},
                    
                    # Credit Revenue (Your Profit)
                    {'wallet': revenue_wallet, 'amount': fees['service_fee'], 'type': LedgerEntry.EntryType.CREDIT},
                ]

                LedgerService.process_transaction(
                    reference=reference,
                    description=f"Withdrawal to {recipient}",
                    tx_type=Transaction.Type.WITHDRAWAL,
                    entries=entries,
                    status=Transaction.Status.COMPLETED
                )

                # TRIGGER M-PESA
                MpesaGateway.trigger_b2c(recipient, amount, reference)

                return Response({
                    "status": "success", 
                    "message": f"Successfully sent KES {amount} to {recipient}",
                    "new_balance": wallet.balance
                })

        except Wallet.DoesNotExist:
            return Response({"error": "Wallet not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)