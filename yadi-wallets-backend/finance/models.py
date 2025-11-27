import uuid
from django.db import models
from django.conf import settings
from decimal import Decimal

class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True) # e.g., KES
    name = models.CharField(max_length=20)
    symbol = models.CharField(max_length=5)

    def __str__(self):
        return self.code

class Wallet(models.Model):
    class Type(models.TextChoices):
        # --- USER WALLETS ---
        CUSTOMER = 'CUSTOMER', 'Personal Wallet'   # Flexible, instant
        ORGANIZER = 'ORGANIZER', 'Business Wallet' # Locked, needs approval
        
        # --- SYSTEM WALLETS (Internal) ---
        MASTER_LIQUIDITY = 'MASTER', 'Liquidity Float (Paybill)' # Actual Cash
        SETTLEMENT = 'SETTLEMENT', 'Settlement (Incoming)'       # Waiting Room
        REVENUE = 'REVENUE', 'Yadi Revenue (Profit)'             # Your Money
        SUSPENSE = 'SUSPENSE', 'Suspense (Held Funds)'           # Payout Lock
        RESERVE = 'RESERVE', 'Reserve (Bank Vault)'              # Safe Storage

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='wallets', null=True, blank=True)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    wallet_type = models.CharField(max_length=20, choices=Type.choices, default=Type.ORGANIZER)

    # --- Customization ---
    label = models.CharField(max_length=50, default="Main Wallet")
    is_primary = models.BooleanField(default=False, help_text="Default wallet for deposits")
    
    # Denormalized Balance (For read speed only. Source of truth is Ledger)
    balance = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0.00'))
    is_frozen = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        owner_label = self.owner.username if self.owner else "SYSTEM"
        return f"{self.get_wallet_type_display()} - {owner_label}"
    



class FeeConfiguration(models.Model):
    """
    Allows Admin to configure withdrawal fees without code changes.
    Example: 0-500 = Free. 501-1000 = 15 KES.
    """
    min_amount = models.DecimalField(max_digits=10, decimal_places=2)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # The Fee YOU keep
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # The Fee SAFARICOM takes (Estimate)
    network_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    def __str__(self):
        return f"Range {self.min_amount}-{self.max_amount}: Svc {self.service_fee} + Net {self.network_fee}"

    class Meta:
        ordering = ['min_amount']





class Transaction(models.Model):
    class Type(models.TextChoices):
        DEPOSIT = 'DEPOSIT', 'Deposit (M-Pesa)'
        WITHDRAWAL = 'WITHDRAWAL', 'Withdrawal (B2C)'
        TICKET_SALE = 'TICKET_SALE', 'Ticket Sale Split'
        FEE = 'FEE', 'Service Fee'
        TRANSFER = 'TRANSFER', 'Internal Transfer' #  Wallet-to-Wallet

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Admin Approval'
        APPROVED = 'APPROVED', 'Approved (Waiting Release)'
        ON_HOLD = 'ON_HOLD', 'Frozen / Under Investigation' 
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REJECTED = 'REJECTED', 'Rejected (Refunded)'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True, help_text="Unique ID (Ticket ID, M-Pesa Ref)")
    
    transaction_type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    description = models.CharField(max_length=255)
    
    created_at = models.DateTimeField(auto_now_add=True)

    # Approval Audit Trail
    is_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='approved_txs')
    scheduled_release_date = models.DateTimeField(null=True, blank=True)


    # External Reference (M-Pesa Receipt)
    external_reference = models.CharField(max_length=100, blank=True, null=True)




class LedgerEntry(models.Model):
    """
    The Truth. Every transaction must have balancing Debit and Credit entries.
    """
    class EntryType(models.TextChoices):
        DEBIT = 'DEBIT', 'Debit (-)'
        CREDIT = 'CREDIT', 'Credit (+)'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name='entries')
    wallet = models.ForeignKey(Wallet, on_delete=models.PROTECT, related_name='entries')
    
    amount = models.DecimalField(max_digits=20, decimal_places=2) # Always positive
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    
    # Snapshot for auditing
    balance_after = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['wallet', 'created_at']),
        ]