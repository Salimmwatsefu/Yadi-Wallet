from django.contrib import admin
from .models import ServiceClient

@admin.register(ServiceClient)
class ServiceClientAdmin(admin.ModelAdmin):
    # This ensures you can see the key in the list view
    list_display = ('name', 'api_key', 'is_active', 'created_at')
    
    # This allows you to see the key inside the edit page (as read-only)
    readonly_fields = ('api_key',)

    # Use this to search if you have many clients
    search_fields = ('name', 'api_key')