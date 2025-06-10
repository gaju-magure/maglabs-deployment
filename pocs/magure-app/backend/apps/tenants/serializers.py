from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from .models import Tenant, Domain, TenantOnboarding

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
        admin_email = validated_data["admin_email"]

        # 1) Create the Tenant (automatically creates schema and runs migrations)
        tenant = Tenant(
            schema_name=schema_name, 
            name=name,
            admin_email=admin_email,
            onboarding_status=Tenant.OnboardingStatus.PENDING
        )
        tenant.save()

        # 2) Register domain in public
        Domain.objects.create(domain=domain_str, tenant=tenant, is_primary=True)

        # 3) Create onboarding tracker
        TenantOnboarding.objects.create(tenant=tenant)

        # 4) Create tenant admin user
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
    onboarding_progress = serializers.SerializerMethodField()

    class Meta:
        model  = Tenant
        fields = [
            "id",
            "name",
            "schema_name",
            "created_at",
            "updated_at",
            "primary_domain",
            "onboarding_status",
            "admin_email",
            "onboarding_progress",
        ]

    def get_primary_domain(self, obj):
        d = Domain.objects.filter(tenant=obj, is_primary=True).first()
        return d.domain if d else None
    
    def get_onboarding_progress(self, obj):
        try:
            onboarding = obj.onboarding
            return {
                'completion_percentage': onboarding.completion_percentage,
                'completed_steps': onboarding.completed_steps,
                'total_steps': onboarding.total_steps,
                'current_step': self._get_current_step(onboarding)
            }
        except TenantOnboarding.DoesNotExist:
            return None
    
    def _get_current_step(self, onboarding):
        if not onboarding.email_sent:
            return 'email_invitation'
        elif not onboarding.profile_setup_completed:
            return 'profile_setup'
        elif not onboarding.company_details_completed:
            return 'company_details'
        elif not onboarding.preferences_completed:
            return 'preferences'
        else:
            return 'completed'


class OnboardingTokenSerializer(serializers.Serializer):
    """Serializer for onboarding token verification"""
    token = serializers.UUIDField()
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")


class OnboardingStepSerializer(serializers.Serializer):
    """Serializer for completing onboarding steps"""
    step_name = serializers.ChoiceField(choices=[
        'email_sent',
        'profile_setup',
        'company_details',
        'preferences'
    ])
    token = serializers.UUIDField()
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")


class ProfileSetupSerializer(serializers.Serializer):
    """Serializer for tenant admin profile setup"""
    token = serializers.UUIDField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(min_length=8, write_only=True)
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class CompanyDetailsSerializer(serializers.Serializer):
    """Serializer for tenant company details setup"""
    token = serializers.UUIDField()
    company_name = serializers.CharField(max_length=255)
    company_size = serializers.ChoiceField(choices=[
        ('1-10', '1-10 employees'),
        ('11-50', '11-50 employees'),
        ('51-200', '51-200 employees'),
        ('201-1000', '201-1000 employees'),
        ('1000+', '1000+ employees')
    ])
    industry = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")


class PreferencesSerializer(serializers.Serializer):
    """Serializer for tenant preferences setup"""
    token = serializers.UUIDField()
    timezone = serializers.CharField(max_length=50, default='UTC')
    date_format = serializers.ChoiceField(choices=[
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('YYYY-MM-DD', 'YYYY-MM-DD')
    ], default='MM/DD/YYYY')
    notifications_enabled = serializers.BooleanField(default=True)
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")


class SendInvitationSerializer(serializers.Serializer):
    """Serializer for sending onboarding invitation"""
    tenant_id = serializers.IntegerField()
    
    def validate_tenant_id(self, value):
        try:
            tenant = Tenant.objects.get(id=value)
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Tenant not found.")
