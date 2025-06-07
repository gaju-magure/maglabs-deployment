from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class TenantUserCreateSerializer(serializers.Serializer):
    email      = serializers.EmailField()
    password   = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name  = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        """
        Prevent creating two users with the same username/email in this tenant.
        Because 'accounts' lives under TENANT_APPS, User.objects here
        queries the tenant's own accounts_user table.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "A user with that email already exists in this tenant."
            )
        return value

    def create(self, validated_data):
        print(User)
        return User.objects.create_user(
            username     = validated_data["email"],
            email        = validated_data["email"],
            password     = validated_data["password"],
            first_name   = validated_data.get("first_name", ""),
            last_name    = validated_data.get("last_name", ""),
            is_staff     = False,
            is_superuser = False,
            role         = "tenant_user",
        )
