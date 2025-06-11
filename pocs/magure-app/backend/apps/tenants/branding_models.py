"""
Tenant branding system models for dynamic theming and customization
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator


class DefaultThemeTemplate(models.Model):
    """
    Predefined theme templates for quick onboarding and professional defaults
    """
    
    TEMPLATE_CATEGORIES = [
        ('business', 'Business Professional'),
        ('creative', 'Creative & Modern'),
        ('industry', 'Industry Specific'),
        ('minimal', 'Minimal & Clean'),
    ]
    
    INDUSTRIES = [
        ('finance', 'Finance & Banking'),
        ('healthcare', 'Healthcare'),
        ('technology', 'Technology'),
        ('creative', 'Creative & Design'),
        ('legal', 'Legal & Professional'),
        ('education', 'Education'),
        ('nonprofit', 'Non-profit'),
        ('manufacturing', 'Manufacturing'),
        ('retail', 'Retail & E-commerce'),
        ('consulting', 'Consulting'),
        ('general', 'General Business'),
    ]
    
    template_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    template_name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Display name for the template"
    )
    template_slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="URL-safe identifier"
    )
    template_category = models.CharField(
        max_length=20,
        choices=TEMPLATE_CATEGORIES,
        default='business'
    )
    template_description = models.TextField(
        max_length=500,
        help_text="Description shown to users during selection"
    )
    
    # Industry targeting
    target_industries = models.JSONField(
        default=list,
        help_text="List of industries this template is designed for"
    )
    
    # Visual assets
    preview_image_url = models.URLField(
        blank=True,
        help_text="URL to template preview image"
    )
    
    # Usage and popularity
    popularity_score = models.PositiveIntegerField(
        default=0,
        help_text="Usage count for popularity ranking"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether template is available for selection"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the system default template"
    )
    
    # Theme configuration
    theme_configuration = models.JSONField(
        default=dict,
        help_text="Complete theme configuration including colors, typography, etc."
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'default_theme_templates'
        ordering = ['-popularity_score', 'template_name']
        constraints = [
            models.UniqueConstraint(
                fields=['is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_template'
            )
        ]
    
    def __str__(self):
        return f"{self.template_name} ({self.template_category})"
    
    def increment_usage(self):
        """Increment popularity score when template is used"""
        self.popularity_score += 1
        self.save(update_fields=['popularity_score'])
    
    @classmethod
    def get_default_template(cls):
        """Get the system default template"""
        return cls.objects.filter(is_default=True, is_active=True).first()
    
    @classmethod
    def get_recommendations_for_industry(cls, industry):
        """Get recommended templates for specific industry"""
        return cls.objects.filter(
            target_industries__contains=[industry],
            is_active=True
        ).order_by('-popularity_score')[:3]


class TenantBranding(models.Model):
    """
    Tenant-specific branding configuration and customization
    """
    
    CUSTOMIZATION_LEVELS = [
        ('basic', 'Basic Customization'),
        ('intermediate', 'Intermediate Customization'),
        ('advanced', 'Advanced Customization'),
    ]
    
    SETUP_SOURCES = [
        ('onboarding', 'Created during onboarding'),
        ('admin_panel', 'Created in admin panel'),
        ('api_import', 'Imported via API'),
        ('template_clone', 'Cloned from template'),
    ]
    
    branding_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    tenant = models.OneToOneField(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='branding'
    )
    
    # Template relationship
    template_source = models.ForeignKey(
        DefaultThemeTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenant_implementations'
    )
    template_version = models.CharField(
        max_length=50,
        blank=True,
        help_text="Version of template when applied"
    )
    auto_update_from_template = models.BooleanField(
        default=False,
        help_text="Whether to auto-update when template changes"
    )
    
    # Setup metadata
    customization_level = models.CharField(
        max_length=20,
        choices=CUSTOMIZATION_LEVELS,
        default='basic'
    )
    setup_source = models.CharField(
        max_length=20,
        choices=SETUP_SOURCES,
        default='onboarding'
    )
    is_onboarding_generated = models.BooleanField(
        default=False,
        help_text="Whether this was created during onboarding"
    )
    can_be_customized = models.BooleanField(
        default=True,
        help_text="Whether tenant can modify branding"
    )
    
    # Color system
    primary_colors = models.JSONField(
        default=dict,
        help_text="Primary color palette with shades"
    )
    secondary_colors = models.JSONField(
        default=dict,
        help_text="Secondary color palette"
    )
    accent_colors = models.JSONField(
        default=dict,
        help_text="Accent colors for success, warning, error, info"
    )
    neutral_palette = models.JSONField(
        default=dict,
        help_text="Neutral grays and background colors"
    )
    
    # Typography
    font_config = models.JSONField(
        default=dict,
        help_text="Font families and configurations"
    )
    font_sizes = models.JSONField(
        default=dict,
        help_text="Font size scale"
    )
    
    # Layout and spacing
    spacing_scale = models.JSONField(
        default=dict,
        help_text="Spacing scale for margins and padding"
    )
    border_radius = models.JSONField(
        default=dict,
        help_text="Border radius values"
    )
    
    # Component overrides
    component_overrides = models.JSONField(
        default=dict,
        help_text="Component-specific style overrides"
    )
    
    # Custom CSS
    custom_css = models.TextField(
        blank=True,
        help_text="Custom CSS for advanced customization"
    )
    css_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="Hash of custom CSS for caching"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Version tracking
    version_number = models.PositiveIntegerField(default=1)
    
    class Meta:
        db_table = 'tenant_branding'
    
    def __str__(self):
        return f"Branding for {self.tenant.name}"
    
    def increment_version(self):
        """Increment version number for cache invalidation"""
        self.version_number += 1
        self.save(update_fields=['version_number'])
    
    def apply_template(self, template):
        """Apply a template configuration to this branding"""
        if template and template.theme_configuration:
            config = template.theme_configuration
            
            self.primary_colors = config.get('primary_colors', {})
            self.secondary_colors = config.get('secondary_colors', {})
            self.accent_colors = config.get('accent_colors', {})
            self.neutral_palette = config.get('neutral_palette', {})
            self.font_config = config.get('font_config', {})
            self.font_sizes = config.get('font_sizes', {})
            self.spacing_scale = config.get('spacing_scale', {})
            self.border_radius = config.get('border_radius', {})
            self.component_overrides = config.get('component_overrides', {})
            
            self.template_source = template
            self.template_version = str(template.updated_at)
            template.increment_usage()
            
            self.increment_version()


class TenantAsset(models.Model):
    """
    Assets (logos, images, etc.) associated with tenant branding
    """
    
    ASSET_TYPES = [
        ('logo_main', 'Main Logo'),
        ('logo_dark', 'Dark Mode Logo'),
        ('logo_light', 'Light Mode Logo'),
        ('favicon', 'Favicon'),
        ('background', 'Background Image'),
        ('icon', 'Custom Icon'),
        ('other', 'Other Asset'),
    ]
    
    ASSET_CATEGORIES = [
        ('core', 'Core Branding'),
        ('optional', 'Optional Enhancement'),
        ('decorative', 'Decorative Element'),
    ]
    
    asset_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    tenant_branding = models.ForeignKey(
        TenantBranding,
        on_delete=models.CASCADE,
        related_name='assets'
    )
    
    # Asset classification
    asset_type = models.CharField(
        max_length=20,
        choices=ASSET_TYPES
    )
    asset_category = models.CharField(
        max_length=20,
        choices=ASSET_CATEGORIES,
        default='core'
    )
    
    # File information
    file_path = models.FileField(
        upload_to='tenant_assets/%Y/%m/',
        help_text="Path to the asset file"
    )
    file_size_bytes = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    mime_type = models.CharField(
        max_length=100,
        help_text="MIME type of the file"
    )
    
    # Image metadata
    dimensions = models.JSONField(
        default=dict,
        help_text="Image dimensions and aspect ratio"
    )
    alt_text = models.CharField(
        max_length=255,
        blank=True,
        help_text="Alt text for accessibility"
    )
    
    # Usage context
    usage_context = models.JSONField(
        default=list,
        help_text="Where this asset is used (header, footer, etc.)"
    )
    
    # Optimization variants
    optimization_variants = models.JSONField(
        default=dict,
        help_text="URLs to optimized versions (WebP, AVIF, different sizes)"
    )
    
    # CDN URLs
    cdn_urls = models.JSONField(
        default=dict,
        help_text="CDN URLs for fast serving"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uploaded_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'tenant_assets'
        unique_together = ['tenant_branding', 'asset_type']
    
    def __str__(self):
        return f"{self.asset_type} for {self.tenant_branding.tenant.name}"


class OnboardingBrandingChoices(models.Model):
    """
    Stores branding choices made during onboarding process
    """
    
    PREFERRED_STYLES = [
        ('minimal', 'Minimal & Clean'),
        ('bold', 'Bold & Dynamic'),
        ('classic', 'Classic & Traditional'),
        ('modern', 'Modern & Contemporary'),
    ]
    
    choice_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    tenant = models.OneToOneField(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='onboarding_branding_choices'
    )
    
    # Template selection
    template_selected = models.ForeignKey(
        DefaultThemeTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Custom choices made during onboarding
    custom_colors = models.JSONField(
        default=dict,
        help_text="User-selected colors during onboarding"
    )
    custom_logo_uploaded = models.BooleanField(
        default=False,
        help_text="Whether user uploaded a logo during onboarding"
    )
    company_logo_path = models.CharField(
        max_length=500,
        blank=True,
        help_text="Path to uploaded logo"
    )
    
    # Preference indicators
    brand_personality = models.JSONField(
        default=list,
        help_text="Selected brand personality traits"
    )
    industry_selection = models.CharField(
        max_length=50,
        blank=True,
        help_text="Industry selected during onboarding"
    )
    target_audience = models.JSONField(
        default=list,
        help_text="Target audience indicators"
    )
    preferred_style = models.CharField(
        max_length=20,
        choices=PREFERRED_STYLES,
        blank=True,
        help_text="Overall style preference"
    )
    
    # Process tracking
    branding_step_completed = models.BooleanField(
        default=False,
        help_text="Whether user completed the branding step"
    )
    customization_level_chosen = models.CharField(
        max_length=20,
        blank=True,
        help_text="Level of customization user chose"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    applied_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When these choices were applied to actual branding"
    )
    
    class Meta:
        db_table = 'onboarding_branding_choices'
    
    def __str__(self):
        return f"Onboarding choices for {self.tenant.name}"
    
    def apply_to_branding(self):
        """Apply these onboarding choices to tenant branding"""
        from django.utils import timezone
        
        branding, created = TenantBranding.objects.get_or_create(
            tenant=self.tenant,
            defaults={
                'is_onboarding_generated': True,
                'setup_source': 'onboarding',
                'customization_level': self.customization_level_chosen or 'basic'
            }
        )
        
        # Apply template if selected
        if self.template_selected:
            branding.apply_template(self.template_selected)
        
        # Apply custom colors if provided
        if self.custom_colors:
            if 'primary' in self.custom_colors:
                branding.primary_colors.update(self.custom_colors['primary'])
            if 'secondary' in self.custom_colors:
                branding.secondary_colors.update(self.custom_colors['secondary'])
        
        branding.save()
        
        # Mark as applied
        self.applied_at = timezone.now()
        self.save(update_fields=['applied_at'])
        
        return branding