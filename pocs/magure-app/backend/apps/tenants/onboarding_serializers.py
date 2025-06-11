"""
Enhanced serializers for onboarding data collection
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tenant
from .onboarding_models import TenantProfile, AdminProfile, WorkspacePreferences, OnboardingProgress
import re
from datetime import datetime


User = get_user_model()


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


class EnhancedProfileSetupSerializer(serializers.Serializer):
    """Enhanced serializer for admin profile setup"""
    token = serializers.UUIDField()
    
    # Basic Profile
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(min_length=8, write_only=True)
    
    # Professional Information
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True)
    department = serializers.ChoiceField(
        choices=AdminProfile.DEPARTMENTS,
        required=False,
        allow_blank=True
    )
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    # Profile Information
    profile_avatar = serializers.ImageField(required=False, allow_null=True)
    linkedin_profile = serializers.URLField(required=False, allow_blank=True)
    
    # Preferences
    preferred_language = serializers.ChoiceField(
        choices=AdminProfile.LANGUAGES,
        default='en'
    )
    
    # Security
    two_factor_enabled = serializers.BooleanField(default=False)
    
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
        
        # Validate phone number format (basic)
        phone = data.get('phone_number', '')
        if phone and not re.match(r'^[\+]?[1-9][\d\s\-\(\)]+$', phone):
            raise serializers.ValidationError({
                'phone_number': 'Invalid phone number format.'
            })
        
        return data


class EnhancedCompanyDetailsSerializer(serializers.Serializer):
    """Enhanced serializer for company details"""
    token = serializers.UUIDField()
    
    # Basic Company Info
    company_name = serializers.CharField(max_length=255)
    company_size = serializers.ChoiceField(choices=[
        ('1-10', '1-10 employees'),
        ('11-50', '11-50 employees'),
        ('51-200', '51-200 employees'),
        ('201-1000', '201-1000 employees'),
        ('1000+', '1000+ employees')
    ])
    industry = serializers.CharField(max_length=100)
    company_website = serializers.URLField(required=False, allow_blank=True)
    company_description = serializers.CharField(
        max_length=1000, 
        required=False, 
        allow_blank=True
    )
    
    # Enhanced Company Details
    company_logo = serializers.ImageField(required=False, allow_null=True)
    business_type = serializers.ChoiceField(
        choices=TenantProfile.BUSINESS_TYPES,
        default='B2B'
    )
    annual_revenue_range = serializers.ChoiceField(
        choices=TenantProfile.REVENUE_RANGES,
        required=False,
        allow_blank=True
    )
    founded_year = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1800,
        max_value=datetime.now().year
    )
    primary_contact_phone = serializers.CharField(
        max_length=20, 
        required=False, 
        allow_blank=True
    )
    
    # Address Information
    street_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state_province = serializers.CharField(max_length=100, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")
    
    def validate_primary_contact_phone(self, value):
        if value and not re.match(r'^[\+]?[1-9][\d\s\-\(\)]+$', value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value


class EnhancedPreferencesSerializer(serializers.Serializer):
    """Enhanced serializer for workspace preferences"""
    token = serializers.UUIDField()
    
    # Basic Preferences (existing)
    timezone = serializers.CharField(max_length=50, default='UTC')
    date_format = serializers.ChoiceField(choices=[
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('YYYY-MM-DD', 'YYYY-MM-DD')
    ], default='MM/DD/YYYY')
    theme = serializers.ChoiceField(choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System')
    ], default='system')
    notifications_enabled = serializers.BooleanField(default=True)
    
    # Enhanced Preferences
    currency = serializers.ChoiceField(
        choices=WorkspacePreferences.CURRENCIES,
        default='USD'
    )
    number_format = serializers.ChoiceField(
        choices=WorkspacePreferences.NUMBER_FORMATS,
        default='US'
    )
    first_day_of_week = serializers.ChoiceField(
        choices=WorkspacePreferences.WEEK_DAYS,
        default='MONDAY'
    )
    
    # Working Hours
    work_start_time = serializers.TimeField(default='09:00')
    work_end_time = serializers.TimeField(default='17:00')
    work_days = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        default=[0, 1, 2, 3, 4],  # Monday to Friday
        allow_empty=False
    )
    
    # Security & Session
    auto_logout_minutes = serializers.IntegerField(
        default=480,
        min_value=30,
        max_value=1440  # 24 hours max
    )
    
    # Feature Configuration
    enabled_modules = serializers.ListField(
        child=serializers.CharField(max_length=50),
        default=list,
        required=False
    )
    
    # Integration Settings
    email_provider = serializers.CharField(max_length=50, required=False, allow_blank=True)
    calendar_integration_enabled = serializers.BooleanField(default=False)
    slack_integration_enabled = serializers.BooleanField(default=False)
    
    # Data Management
    data_retention_days = serializers.IntegerField(
        default=365,
        min_value=30,
        max_value=2555  # 7 years max
    )
    backup_frequency = serializers.ChoiceField(
        choices=[
            ('DAILY', 'Daily'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
        ],
        default='WEEKLY'
    )
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")
    
    def validate_work_days(self, value):
        if not value:
            raise serializers.ValidationError("At least one working day must be selected.")
        
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate working days are not allowed.")
        
        return sorted(value)
    
    def validate(self, data):
        # Validate work hours
        start_time = data.get('work_start_time')
        end_time = data.get('work_end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'work_end_time': 'End time must be after start time.'
            })
        
        return data


class OnboardingStepSerializer(serializers.Serializer):
    """Serializer for completing individual onboarding steps"""
    token = serializers.UUIDField()
    step_name = serializers.ChoiceField(
        choices=OnboardingProgress.STEPS
    )
    step_data = serializers.JSONField(required=False, default=dict)
    
    def validate_token(self, value):
        try:
            tenant = Tenant.objects.get(onboarding_token=value)
            if not tenant.is_onboarding_token_valid():
                raise serializers.ValidationError("Onboarding token has expired.")
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid onboarding token.")


class OnboardingStatusSerializer(serializers.Serializer):
    """Serializer for getting onboarding status"""
    tenant_name = serializers.CharField()
    onboarding_status = serializers.CharField()
    current_step = serializers.CharField()
    completion_percentage = serializers.IntegerField()
    completed_steps = serializers.ListField()
    total_steps = serializers.IntegerField()
    can_edit_steps = serializers.DictField()
    step_data = serializers.DictField()
    environment_info = serializers.DictField()


