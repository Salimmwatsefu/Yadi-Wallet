from rest_framework import serializers
from .models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number',
            'theme_preference', 'is_kyc_verified', 'kyc_rejection_reason',
            # --- New KYC Fields ---
            'national_id_number', 'kra_pin',
            'id_front_image', 'id_back_image'
        ]
        # 'is_kyc_verified' MUST be read-only so users can't verify themselves!
        read_only_fields = ['id', 'username', 'email', 'phone_number', 'is_kyc_verified', 'kyc_rejection_reason']