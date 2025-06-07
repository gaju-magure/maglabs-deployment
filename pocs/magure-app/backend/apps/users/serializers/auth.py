from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["user_id"] = str(user.id)
        token["email"] = user.email
        token["username"] = user.username
        token["role"] = user.role

        if hasattr(user, "tenant"):
            token["tenant_schema"] = user.tenant.schema_name
            token["tenant_name"] = user.tenant.name

            try:
                primary_domain = user.tenant.domain_set.get(is_primary=True).domain
            except Exception:
                primary_domain = None
            token["tenant_domain"] = primary_domain

        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        data.update({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": self.user.role,
            "email": self.user.email,
            "username": self.user.username,
        })

        if hasattr(self.user, "tenant"):
            data["tenant_schema"] = self.user.tenant.schema_name
            data["tenant_name"] = self.user.tenant.name
            try:
                data["tenant_domain"] = self.user.tenant.domain_set.get(is_primary=True).domain
            except Exception:
                data["tenant_domain"] = None
        else:
            data["tenant_schema"] = None
            data["tenant_name"] = None
            data["tenant_domain"] = None

        return data
