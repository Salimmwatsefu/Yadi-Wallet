from django.contrib import admin
from django.utils.html import format_html
from .models import User

@admin.action(description='✅ Approve KYC for Selected Users')
def approve_kyc(modeladmin, request, queryset):
    queryset.update(is_kyc_verified=True, kyc_rejection_reason=None)

@admin.action(description='🚫 Reject KYC (Reset)')
def reject_kyc(modeladmin, request, queryset):
    queryset.update(is_kyc_verified=False, kyc_rejection_reason="Documents unclear. Please re-upload.")

class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_kyc_verified', 'id_preview', 'date_joined')
    list_filter = ('is_kyc_verified',)
    search_fields = ('email', 'national_id_number')
    actions = [approve_kyc, reject_kyc]
    
    # --- FIXED FIELDSETS (Removed Password) ---
    fieldsets = (
        ('Identity', {'fields': ('email', 'username', 'phone_number')}),
        ('KYC Documents', {'fields': ('national_id_number', 'kra_pin', 'id_front_image', 'id_back_image', 'is_kyc_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    # ------------------------------------------

    def id_preview(self, obj):
        if obj.id_front_image:
            return format_html('<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" />', obj.id_front_image.url)
        return "-"
    id_preview.short_description = "ID Doc"

admin.site.register(User, UserAdmin)