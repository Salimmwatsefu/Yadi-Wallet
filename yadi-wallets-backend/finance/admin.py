from django.contrib import admin
from django.utils import timezone
from datetime import timedelta
from .models import Transaction, Wallet, LedgerEntry

@admin.action(description='✅ Approve & Schedule (48h Release)')
def approve_withdrawals(modeladmin, request, queryset):
    for tx in queryset:
        if tx.status in [Transaction.Status.PENDING_APPROVAL, Transaction.Status.ON_HOLD]:
            tx.status = Transaction.Status.APPROVED
            tx.is_approved = True
            tx.approved_at = timezone.now()
            tx.approved_by = request.user
            # Lock for 48 hours
            tx.scheduled_release_date = timezone.now() + timedelta(hours=48)
            tx.save()

@admin.action(description='❄️ Freeze / Hold Indefinitely')
def freeze_transactions(modeladmin, request, queryset):
    for tx in queryset:
        # Allow freezing approved or pending transactions
        if tx.status in [Transaction.Status.PENDING_APPROVAL, Transaction.Status.APPROVED]:
            tx.status = Transaction.Status.ON_HOLD
            tx.scheduled_release_date = None
            tx.save()

class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference', 'transaction_type', 'status', 'amount_display', 'created_at', 'scheduled_release_date']
    list_filter = ['status', 'transaction_type', 'created_at']
    search_fields = ['reference', 'description']
    actions = [approve_withdrawals, freeze_transactions]
    
    def amount_display(self, obj):
        entry = obj.entries.filter(entry_type='DEBIT').first()
        return entry.amount if entry else 0

admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Wallet)
admin.site.register(LedgerEntry)