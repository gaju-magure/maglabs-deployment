from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers

User = settings.AUTH_USER_MODEL  # or get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Subclass of TokenObtainPairSerializer that:
    - Authenticates the user (same as the base class).
    - Inserts extra fields (role, tenant_schema, tenant_name, tenant_domain, etc.)
      into the access token payload.
    """

    @classmethod
    def get_token(cls, user):
        """
        Override get_token to attach extra claims onto the token itself.
        Inside here, `user` is the authenticated User instance.
        """
        token = super().get_token(user)

        # 1) Always include the user’s ID, email, and username. (The base class
        #    already puts user_id into the “sub” claim, but we’ll repeat it if we want.)
        token["user_id"]   = str(user.id)
        token["email"]     = user.email
        token["username"]  = user.username

        # 2) Include your custom User fields (e.g. role)
        token["role"] = user.role

        # 3) If your User model has a foreign‐key to a Tenant (or stores tenant info),
        #    include those here. For example:
        if hasattr(user, "tenant"):
            token["tenant_schema"] = user.tenant.schema_name
            token["tenant_name"]   = user.tenant.name

            # If you also store “domain” on the Tenant or on a related Domain model:
            primary_domain = None
            # (You might have a method or a cached property. For example:)
            try:
                # Assume Tenant has a related_name="domains" for DomainMixin,
                # and one of them is marked is_primary=True.
                primary_domain = user.tenant.domain_set.get(is_primary=True).domain
            except Exception:
                primary_domain = None

            token["tenant_domain"] = primary_domain

        # 4) Any other extra claims (first_name/last_name) if you want:
        token["first_name"] = user.first_name
        token["last_name"]  = user.last_name

        return token

    def validate(self, attrs):
        """
        Copy the base behavior for username/password → user/auth. Then
        only difference is we return both access & refresh plus any extra data.
        """
        data = super().validate(attrs)

        refresh = self.get_token(self.user)

        data["refresh"] = str(refresh)
        data["access"]  = str(refresh.access_token)

        # Optionally, you can return whatever extra fields here, but generally
        # the React side will decode the token itself.
        data["role"]    = self.user.role
        data["email"]   = self.user.email
        data["username"] = self.user.username

        if hasattr(self.user, "tenant"):
            data["tenant_schema"] = self.user.tenant.schema_name
            data["tenant_name"]   = self.user.tenant.name
            try:
                data["tenant_domain"] = (
                    self.user.tenant.domain_set.get(is_primary=True).domain
                )
            except Exception:
                data["tenant_domain"] = None
        else:
            data["tenant_schema"] = None
            data["tenant_name"]   = None
            data["tenant_domain"] = None

        return data


# You can also have a plain Serializer for logging in if you want to override
# specific field‐names, but the above is all you strictly need.