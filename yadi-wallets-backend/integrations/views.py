import requests
import uuid
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Sum

from users.models import User
from finance.models import Wallet, Currency, LedgerEntry, Transaction
from finance.services import LedgerService
from django.core.signing import TimestampSigner
import hmac
import hashlib
import json
from django.conf import settings

# --- HELPER: Webhook Sender ---
import hmac
import hashlib
import json
import requests
from decouple import config

from django.core.paginator import Paginator

def send_webhook_notification(reference, status):
    base_url = config('TICKETS_SERVICE_URL', default="http://localhost:8000")
    webhook_url = f"{base_url}/api/webhooks/payment/"
    
    # 1. Prepare the payload
    payload = {"reference": reference, "status": status}
    
    # 2. Convert to JSON bytes
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    # 3. Generate Signature
    secret = config('WEBHOOK_SECRET').encode('utf-8')
    signature = hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()
    
    headers = {
        'Content-Type': 'application/json',
        'X-Yadi-Signature': signature  
    }
    
    try:
        print(f"📣 Sending Secured Webhook for {reference}...")
        requests.post(webhook_url, data=payload_bytes, headers=headers, timeout=20)
        print(f"✅ Webhook delivered.")
    except Exception as e:
        print(f"❌ Webhook failed: {e}")


# --- VIEW 1: User Onboarding (The Handshake) ---
# yadi-wallets/integrations/views.py

class OnboardUserView(APIView):
    """
    Called by Yadi Tickets. 
    Handles 'Smart Merging' of existing customers into Organizers.
    """
    def post(self, request):
        data = request.data
        remote_id = data.get('remote_id')
        email = data.get('email')
        raw_phone = data.get('phone')
        phone = raw_phone if raw_phone else None

        if not remote_id or not email:
            return Response({"error": "Missing data"}, status=400)

        try:
            with transaction.atomic():
                # 1. Try to find by Remote ID first (Already linked)
                user = User.objects.filter(remote_ticket_user_id=remote_id).first()

                # 2. If not linked, try to find by Email (The "Customer -> Organizer" path)
                if not user:
                    user = User.objects.filter(email=email).first()
                    if user:
                        # LINK THEM: This existing customer is now also an Organizer
                        print(f"🔗 Merging User: Linking Ticket ID {remote_id} to {email}")
                        user.remote_ticket_user_id = remote_id
                        user.save()
                
                # 3. If still no user, Create New (The "Organizer First" path)
                if not user:
                    print(f"🆕 Creating New Organizer: {email}")
                    user = User.objects.create_user(
                        username=email,
                        email=email,
                        phone_number=phone,
                        remote_ticket_user_id=remote_id
                    )
                    user.set_unusable_password()
                    user.save()

                # 4. Ensure Organizer Wallet Exists
                # (They might already have a Customer wallet, but they NEED an Organizer one now)
                currency, _ = Currency.objects.get_or_create(code='KES')
                
                wallet, created = Wallet.objects.get_or_create(
                    owner=user,
                    wallet_type=Wallet.Type.ORGANIZER,
                    defaults={'currency': currency}
                )

            return Response({
                "status": "active",
                "wallet_id": wallet.id,
                "user_id": user.id,
                "merged_existing": not created # Meta info for debugging
            }, status=201)

        except Exception as e:
            print(f"Onboard Error: {e}")
            return Response({"error": str(e)}, status=400)


# --- VIEW 2: Balance Check (The Dashboard Proxy) ---
class ServiceBalanceView(APIView):
    """
    GET /api/service/balance/{remote_user_id}/
    """
    def get(self, request, remote_id):
        try:
            user = User.objects.get(remote_ticket_user_id=remote_id)
            wallet = Wallet.objects.get(owner=user, wallet_type=Wallet.Type.ORGANIZER)
            
            # Calculate Pending Payouts
            pending_amount = LedgerEntry.objects.filter(
                wallet=wallet,
                transaction__status__in=[
                    Transaction.Status.PENDING_APPROVAL, 
                    Transaction.Status.APPROVED, 
                    Transaction.Status.ON_HOLD
                ],
                entry_type=LedgerEntry.EntryType.DEBIT
            ).aggregate(Sum('amount'))['amount__sum'] or 0

            return Response({
                "balance": wallet.balance,
                "pending_payouts": pending_amount,
                "currency": wallet.currency.code,
                "is_frozen": wallet.is_frozen,
                "is_kyc_verified": user.is_kyc_verified,
                "status": "Active"
            })
        except (User.DoesNotExist, Wallet.DoesNotExist):
            return Response({"balance": 0.00, "pending_payouts": 0.00, "currency": "KES", "is_kyc_verified": False}, status=200)


# --- VIEW 3: Payment Collection (The Money Flow) ---
class CollectPaymentView(APIView):
    """
    POST /api/service/payment/collect/
    Trigger M-Pesa STK Push and credit the organizer.
    """
    def post(self, request):
        data = request.data
        phone = data.get('phone')
        amount = data.get('amount')
        ticket_ref = data.get('reference') # The Ticket ID
        organizer_remote_id = data.get('organizer_id')

        if not all([phone, amount, ticket_ref, organizer_remote_id]):
            return Response({"error": "Missing data"}, status=400)

        try:
            mpesa_receipt = f"MPESA-{uuid.uuid4().hex[:8].upper()}"

            with transaction.atomic():
                # 1. Identify Wallets
                org_user = User.objects.get(remote_ticket_user_id=organizer_remote_id)
                org_wallet = Wallet.objects.get(owner=org_user, wallet_type=Wallet.Type.ORGANIZER)
                
                master_wallet = Wallet.objects.get(wallet_type=Wallet.Type.MASTER_LIQUIDITY)
                revenue_wallet = Wallet.objects.get(wallet_type=Wallet.Type.REVENUE)

                # 2. Calculate Split
                total_amount = Decimal(str(amount))
                fee = total_amount * Decimal('0.04')
                net_amount = total_amount - fee

                # 3. Write to Ledger (Money In)
                entries = [
                    {'wallet': master_wallet, 'amount': total_amount, 'type': 'DEBIT'}, # Cash In Bank (Liability)
                    {'wallet': org_wallet, 'amount': net_amount, 'type': 'CREDIT'},     # Liability to Org
                    {'wallet': revenue_wallet, 'amount': fee, 'type': 'CREDIT'},        # Liability to Self
                ]

                LedgerService.process_transaction(
                    reference=ticket_ref,
                    description=f"Ticket Sale: {ticket_ref}",
                    tx_type=Transaction.Type.TICKET_SALE,
                    entries=entries
                )

            # --- WEBHOOK TRIGGER ---
            # We call this AFTER the 'with transaction.atomic()' block closes.
            # This ensures we don't notify the Ticket App if the DB save failed.
            send_webhook_notification(ticket_ref, 'COMPLETED')
            # -----------------------

            return Response({"status": "success", "mpesa_ref": mpesa_receipt})

        except Exception as e:
            print(f"Payment Error: {e}")
            return Response({"error": str(e)}, status=500)
        


# --- VIEW 4: Withdrawal Proxy (Money Out) ---
class ServiceWithdrawalView(APIView):
    """
    POST /api/service/withdraw/
    Tickets App requests a withdrawal on behalf of an organizer.
    Payload: { "remote_user_id": "uuid", "amount": "1000" }
    """
    def post(self, request):
        data = request.data
        remote_id = data.get('remote_user_id')
        amount_str = data.get('amount')

        if not remote_id or not amount_str:
            return Response({"error": "Missing remote_user_id or amount"}, status=400)

        try:
            amount = Decimal(str(amount_str))
            if amount <= 0:
                return Response({"error": "Invalid amount"}, status=400)

            # 1. Find User & Wallet
            try:
                user = User.objects.get(remote_ticket_user_id=remote_id)
            except User.DoesNotExist:
                return Response({"error": "User account not found"}, status=404)

            # --- 🛑 SECURITY CHECK: KYC ENFORCEMENT ---
            if not user.is_kyc_verified:
                 return Response({
                     "error": "Account Not Verified", 
                     "code": "KYC_REQUIRED",
                     "message": "You must verify your identity before withdrawing funds."
                 }, status=403)
            
            wallet = Wallet.objects.get(owner=user, wallet_type=Wallet.Type.ORGANIZER)

            if wallet.balance < amount:
                return Response({"error": "Insufficient funds"}, status=400)

            # 2. Define Transaction
            reference = f"WD-{uuid.uuid4().hex[:8].upper()}"
            suspense_wallet = Wallet.objects.get(wallet_type=Wallet.Type.SUSPENSE)

            # 3. Atomic Ledger (Move from Organizer -> Suspense)
            with transaction.atomic():
                entries = [
                    {'wallet': wallet, 'amount': amount, 'type': LedgerEntry.EntryType.DEBIT},   # Deduct User
                    {'wallet': suspense_wallet, 'amount': amount, 'type': LedgerEntry.EntryType.CREDIT} # Hold in Suspense
                ]

                tx = LedgerService.process_transaction(
                    reference=reference,
                    description=f"Withdrawal Request by {user.email}",
                    tx_type=Transaction.Type.WITHDRAWAL,
                    entries=entries
                )
                
                # Lock it for Admin Approval
                tx.status = Transaction.Status.PENDING_APPROVAL
                tx.save()

            return Response({
                "status": "received",
                "message": "Withdrawal request received. Pending Admin Approval.",
                "reference": reference,
                "new_balance": wallet.balance # Updated balance (post-deduction)
            })

        except User.DoesNotExist:
            return Response({"error": "User wallet not found"}, status=404)
        except Exception as e:
            print(f"Withdrawal Error: {e}")
            return Response({"error": str(e)}, status=500)
        



class GenerateMagicLinkView(APIView):
    """
    POST /api/service/auth/link/
    Generates a short-lived, signed URL for the frontend to consume.
    """
    def post(self, request):
        remote_id = request.data.get('remote_user_id')
        
        if not remote_id:
            return Response({"error": "Missing remote_user_id"}, status=400)

        try:
            # 1. Verify user exists
            user = User.objects.get(remote_ticket_user_id=remote_id)
            
            # 2. Generate Signed Token (Contains user ID + Timestamp)
            # This token is valid for max_age seconds (e.g., 300s = 5 mins)
            signer = TimestampSigner()
            token = signer.sign(str(user.id))
            
            # 3. Construct the Frontend URL
            # In Prod, put this base URL in settings.py
            frontend_url = "http://localhost:5174/auth/magic-login"
            magic_link = f"{frontend_url}?token={token}"

            return Response({
                "magic_link": magic_link,
                "expires_in": 300
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        


# --- VIEW 5: Transaction History Proxy ---
class ServiceHistoryView(APIView):
    """
    GET /api/service/history/{remote_id}/?page=1&page_size=10
    """
    def get(self, request, remote_id):
        try:
            user = User.objects.get(remote_ticket_user_id=remote_id)
            wallet = Wallet.objects.get(owner=user, wallet_type=Wallet.Type.ORGANIZER)
            
            # 1. Get ALL entries (Lazy QuerySet)
            queryset = LedgerEntry.objects.filter(wallet=wallet).select_related('transaction').order_by('-created_at')
            
            # 2. Paginate
            page_number = request.query_params.get('page', 1)
            page_size = request.query_params.get('page_size', 10)
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page_number)

            # 3. Serialize
            history = []
            for entry in page_obj:
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
                "results": history,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous()
            })

        except (User.DoesNotExist, Wallet.DoesNotExist):
            return Response({
                "results": [], 
                "total_pages": 1, 
                "current_page": 1
            }, status=200)