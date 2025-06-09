from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from .models import Tenant, Domain

User = get_user_model()

class TenantCreateSerializer(serializers.Serializer):
    name           = serializers.CharField(max_length=255)
    domain_prefix  = serializers.CharField(max_length=64)
    admin_email    = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)

    def validate_domain_prefix(self, value):
        prefix = slugify(value)
        full_domain = f"{prefix}.maglabs.api"

        if Domain.objects.filter(domain=full_domain).exists():
            raise serializers.ValidationError(f"Domain '{full_domain}' is already taken.")

        return prefix

    def validate(self, data):
        prefix = data["domain_prefix"]
        schema_name = slugify(prefix)
        public_schema = get_public_schema_name()

        if schema_name == public_schema:
            raise serializers.ValidationError({
                "domain_prefix": f"The derived schema name '{schema_name}' is reserved."
            })

        if Tenant.objects.filter(schema_name=schema_name).exists():
            raise serializers.ValidationError({
                "domain_prefix": f"A tenant with derived schema name '{schema_name}' already exists."
            })

        data["schema_name"] = schema_name
        data["full_domain"] = f"{schema_name}.maglabs.api"
        return data

    def create(self, validated_data):
        name        = validated_data["name"]
        schema_name = validated_data["schema_name"]
        domain_str  = validated_data["full_domain"]

        # 1) Create the Tenant (automatically creates schema and runs migrations)
        tenant = Tenant(schema_name=schema_name, name=name)
        tenant.save()

        # 2) Register domain in public
        Domain.objects.create(domain=domain_str, tenant=tenant, is_primary=True)

        with schema_context(tenant.schema_name):
            User = get_user_model()
            User.objects.create_user(
                username=validated_data["admin_email"],
                email=validated_data["admin_email"],
                password=validated_data["admin_password"],
                role="tenant_admin",
                is_staff=True,
                is_superuser=False,
            )

        return tenant


class TenantInfoSerializer(serializers.ModelSerializer):
    primary_domain = serializers.SerializerMethodField()

    class Meta:
        model  = Tenant
        fields = [
            "id",
            "name",
            "schema_name",
            "created_at",
            "updated_at",
            "primary_domain",
        ]

    def get_primary_domain(self, obj):
        d = Domain.objects.filter(tenant=obj, is_primary=True).first()
        return d.domain if d else None
