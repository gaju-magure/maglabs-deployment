from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from .models import Tenant, Domain
from .onboarding_models import OnboardingProgress
from .branding_models import TenantBranding, DefaultThemeTemplate, TenantAsset, OnboardingBrandingChoices

User = get_user_model()

class TenantCreateSerializer(serializers.Serializer):
    name           = serializers.CharField(max_length=255)
    domain_prefix  = serializers.CharField(max_length=64)
    admin_email    = serializers.EmailField(write_only=True)
    status         = serializers.ChoiceField(choices=Tenant.Status.choices, default=Tenant.Status.ACTIVE)

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
        status      = validated_data.get("status", Tenant.Status.ACTIVE)

        # 1) Create the Tenant (automatically creates schema and runs migrations)
        # Default onboarding status is PENDING, will be set to IN_PROGRESS when invitation is sent
        tenant = Tenant(
            schema_name=schema_name, 
            name=name,
            admin_email=admin_email,
            status=status,
            onboarding_status=Tenant.OnboardingStatus.PENDING
        )
        tenant.save()

        # 2) Register domain in public
        Domain.objects.create(domain=domain_str, tenant=tenant, is_primary=True)

        # 3) Create enhanced onboarding progress tracker
        OnboardingProgress.objects.create(
            tenant=tenant,
            session_id='',
            ip_address='',
            user_agent='system_creation'
        )

        # 4) Create tenant admin user (password will be set during onboarding)
        with schema_context(tenant.schema_name):
            User = get_user_model()
            admin_user = User.objects.create_user(
                username=admin_email,
                email=admin_email,
                password=None,  # No password initially - set during onboarding
                role="tenant_admin",
                is_staff=True,
                is_superuser=False,
            )
            admin_user.set_unusable_password()
            admin_user.save()

        return tenant


class TenantInfoSerializer(serializers.ModelSerializer):
    primary_domain = serializers.SerializerMethodField()
    onboarding_progress = serializers.SerializerMethodField()

    class Meta:
        model  = Tenant
        fields = [
            "id",
            "name",
            "status",
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
            progress = obj.onboarding_progress
            # Ensure completion percentage reflects final state for completed onboarding
            if obj.onboarding_status == Tenant.OnboardingStatus.COMPLETED:
                completion_percentage = 100
            else:
                completed_count = len([step for step in progress.completed_steps if step != 'COMPLETE'])
                completion_percentage = (completed_count / progress.total_steps) * 100 if progress.total_steps > 0 else 0
            
            return {
                'completion_percentage': completion_percentage,
                'completed_steps': len(progress.completed_steps),
                'total_steps': progress.total_steps,
                'current_step': progress.current_step
            }
        except OnboardingProgress.DoesNotExist:
            return None


class DefaultThemeTemplateSerializer(serializers.ModelSerializer):
    """Serializer for theme templates"""
    
    class Meta:
        model = DefaultThemeTemplate
        fields = [
            'template_id', 'template_name', 'template_slug', 
            'template_category', 'template_description', 'target_industries',
            'preview_image_url', 'popularity_score', 'is_active', 'is_default',
            'theme_configuration', 'created_at'
        ]
        read_only_fields = ['template_id', 'popularity_score', 'created_at']


class TenantAssetSerializer(serializers.ModelSerializer):
    """Serializer for tenant assets"""
    
    class Meta:
        model = TenantAsset
        fields = [
            'asset_id', 'asset_type', 'asset_category', 'file_path',
            'file_size_bytes', 'mime_type', 'dimensions', 'alt_text',
            'usage_context', 'optimization_variants', 'cdn_urls', 'created_at'
        ]
        read_only_fields = ['asset_id', 'file_size_bytes', 'mime_type', 'dimensions', 'created_at']


class TenantBrandingSerializer(serializers.ModelSerializer):
    """Serializer for tenant branding configuration"""
    assets = TenantAssetSerializer(many=True, read_only=True)
    template_source = DefaultThemeTemplateSerializer(read_only=True)
    
    class Meta:
        model = TenantBranding
        fields = [
            'branding_id', 'template_source', 'template_version', 'auto_update_from_template',
            'customization_level', 'setup_source', 'is_onboarding_generated', 'can_be_customized',
            'primary_colors', 'secondary_colors', 'accent_colors', 'neutral_palette',
            'font_config', 'font_sizes', 'spacing_scale', 'border_radius',
            'component_overrides', 'custom_css', 'version_number',
            'assets', 'created_at', 'updated_at'
        ]
        read_only_fields = ['branding_id', 'version_number', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        """Update branding and increment version for cache invalidation"""
        updated_instance = super().update(instance, validated_data)
        updated_instance.increment_version()
        return updated_instance


class TenantBrandingCreateUpdateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating/updating branding without nested data"""
    template_id = serializers.UUIDField(required=False, allow_null=True)
    
    class Meta:
        model = TenantBranding
        fields = [
            'template_id', 'auto_update_from_template', 'customization_level',
            'primary_colors', 'secondary_colors', 'accent_colors', 'neutral_palette',
            'font_config', 'font_sizes', 'spacing_scale', 'border_radius',
            'component_overrides', 'custom_css'
        ]
    
    def create(self, validated_data):
        template_id = validated_data.pop('template_id', None)
        tenant = self.context['tenant']
        
        branding = TenantBranding.objects.create(
            tenant=tenant,
            setup_source='admin_panel',
            **validated_data
        )
        
        # Apply template if provided
        if template_id:
            try:
                template = DefaultThemeTemplate.objects.get(template_id=template_id, is_active=True)
                branding.apply_template(template)
            except DefaultThemeTemplate.DoesNotExist:
                pass
        
        return branding
    
    def update(self, instance, validated_data):
        template_id = validated_data.pop('template_id', None)
        
        # Apply template if provided
        if template_id:
            try:
                template = DefaultThemeTemplate.objects.get(template_id=template_id, is_active=True)
                instance.apply_template(template)
            except DefaultThemeTemplate.DoesNotExist:
                pass
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        instance.increment_version()
        return instance