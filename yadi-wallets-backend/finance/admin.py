from django.contrib import admin
from django import forms
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import Wallet, Transaction, LedgerEntry, FeeConfiguration
from django.utils import timezone
from datetime import timedelta

# --- 1. REVENUE PAYOUT ACTION ---
class PayoutForm(forms.Form):
    amount = forms.DecimalField(label="Amount to Withdraw")
    phone_number = forms.CharField(max_length=15, help_text="Format: 2547...", label="M-Pesa Number")

@admin.action(description='💸 Withdraw Revenue (Payout to Admin)')
def withdraw_revenue_action(modeladmin, request, queryset):
    # Ensure we only do this for REVENUE wallets
    for wallet in queryset:
        if wallet.wallet_type != Wallet.Type.REVENUE:
            messages.error(request, "This action applies ONLY to Revenue Wallets.")
            return

    # Handle Form Submission
    if 'apply' in request.POST:
        form = PayoutForm(request.POST)
        if form.is_valid():
            amount = form.cleaned_data['amount']
            phone = form.cleaned_data['phone_number']
            wallet = queryset.first() 

            if wallet.balance < amount:
                messages.error(request, "Insufficient Revenue Balance.")
                return

            # TODO: Trigger Actual LedgerService & M-Pesa Here
            # For now, we just flash a message to simulate success
            messages.success(request, f"Successfully initiated payout of KES {amount} to {phone}")
            return redirect(request.get_full_path())
    
    else:
        form = PayoutForm()

    return render(request, 'admin/withdraw_revenue_form.html', {'form': form, 'wallet': queryset.first()})


# --- 2. TRANSACTION ACTIONS ---
@admin.action(description='✅ Approve & Schedule (48h Release)')
def approve_withdrawals(modeladmin, request, queryset):
    for tx in queryset:
        if tx.status in [Transaction.Status.PENDING_APPROVAL, Transaction.Status.ON_HOLD]:
            tx.status = Transaction.Status.APPROVED
            tx.is_approved = True
            tx.approved_at = timezone.now()
            tx.approved_by = request.user
            tx.scheduled_release_date = timezone.now() + timedelta(hours=48)
            tx.save()

@admin.action(description='❄️ Freeze / Hold Indefinitely')
def freeze_transactions(modeladmin, request, queryset):
    for tx in queryset:
        if tx.status in [Transaction.Status.PENDING_APPROVAL, Transaction.Status.APPROVED]:
            tx.status = Transaction.Status.ON_HOLD
            tx.scheduled_release_date = None
            tx.save()

# --- 3. MODEL REGISTRATIONS ---

class WalletAdmin(admin.ModelAdmin):
    list_display = ['label', 'wallet_type', 'balance', 'owner', 'currency']
    list_filter = ['wallet_type', 'is_frozen']
    search_fields = ['owner__username', 'owner__email', 'label']
    actions = [withdraw_revenue_action]

class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference', 'transaction_type', 'status', 'amount_display', 'created_at']
    list_filter = ['status', 'transaction_type', 'created_at']
    search_fields = ['reference', 'description']
    actions = [approve_withdrawals, freeze_transactions]
    
    def amount_display(self, obj):
        entry = obj.entries.filter(entry_type='DEBIT').first()
        return entry.amount if entry else 0

@admin.register(FeeConfiguration)
class FeeConfigAdmin(admin.ModelAdmin):
    list_display = ['min_amount', 'max_amount', 'service_fee', 'network_fee']
    list_editable = ['service_fee', 'network_fee']

admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Wallet, WalletAdmin)
admin.site.register(LedgerEntry)