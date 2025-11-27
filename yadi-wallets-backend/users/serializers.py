from rest_framework import serializers
from .models import User

class UserProfileSerializer(serializers.ModelSerializer):
    # Allow writing phone_number
    phone_number = serializers.CharField(required=False)
    
    # Custom flag to trigger verification
    verify_me = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number',
            'theme_preference', 'is_kyc_verified', 'kyc_rejection_reason',
            # Keep these in model but maybe hide from API if not used?
            # 'national_id_number', 'kra_pin', ... 
            'verify_me'
        ]
        read_only_fields = ['id', 'username', 'email', 'is_kyc_verified', 'kyc_rejection_reason']

    def update(self, instance, validated_data):
        # Check for the special flag from frontend
        should_verify = validated_data.pop('verify_me', False)
        
        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # LITE KYC LOGIC:
        # If they provided a phone number AND asked to verify -> Auto Verify
        if should_verify and instance.phone_number:
            instance.is_kyc_verified = True
            instance.kyc_rejection_reason = None # Clear any past rejections
        
        instance.save()
        return instance