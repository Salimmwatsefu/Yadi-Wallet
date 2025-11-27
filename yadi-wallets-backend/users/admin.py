from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User

@admin.action(description='✅ Approve KYC for Selected Users')
def approve_kyc(modeladmin, request, queryset):
    queryset.update(is_kyc_verified=True, kyc_rejection_reason=None)

@admin.action(description='🚫 Reject KYC (Reset)')
def reject_kyc(modeladmin, request, queryset):
    queryset.update(is_kyc_verified=False, kyc_rejection_reason="Documents unclear. Please re-upload.")

class UserAdmin(BaseUserAdmin):
    # Columns to show in the list view
    list_display = ('username', 'email', 'phone_number', 'is_kyc_verified', 'commission_rate', 'id_preview')
    list_filter = ('is_kyc_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone_number', 'national_id_number')
    actions = [approve_kyc, reject_kyc]

    # Organize the Edit Form
    fieldsets = (
        ('Identity', {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Wallet Settings', {'fields': ('commission_rate', 'theme_preference')}),
        ('KYC & Compliance', {
            'fields': (
                'is_kyc_verified', 
                'kyc_rejection_reason',
                'national_id_number', 
                'kra_pin', 
                'id_front_image', 
                'id_back_image'
            ),
            'classes': ('collapse',), # Collapsed by default to save space
        }),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    def id_preview(self, obj):
        if obj.id_front_image:
            return format_html('<a href="{}" target="_blank">View ID</a>', obj.id_front_image.url)
        return "-"
    id_preview.short_description = "KYC Doc"

# Unregister existing/default User if necessary, then register ours
admin.site.register(User, UserAdmin)