"""
Enhanced onboarding models for storing detailed tenant and admin information
"""

from django.db import models
from django.contrib.auth import get_user_model
from .models import Tenant


class TenantProfile(models.Model):
    """Extended tenant profile with detailed company information"""
    
    BUSINESS_TYPES = [
        ('B2B', 'Business to Business'),
        ('B2C', 'Business to Consumer'),
        ('B2B2C', 'Business to Business to Consumer'),
        ('OTHER', 'Other'),
    ]
    
    REVENUE_RANGES = [
        ('0-1M', '$0 - $1M'),
        ('1M-5M', '$1M - $5M'),
        ('5M-10M', '$5M - $10M'),
        ('10M-50M', '$10M - $50M'),
        ('50M+', '$50M+'),
        ('PRIVATE', 'Prefer not to say'),
    ]
    
    tenant = models.OneToOneField(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    
    # Company Information
    company_logo = models.ImageField(
        upload_to='tenant_logos/', 
        null=True, 
        blank=True
    )
    company_website = models.URLField(blank=True)
    company_description = models.TextField(max_length=1000, blank=True)
    
    # Business Details
    business_type = models.CharField(
        max_length=10, 
        choices=BUSINESS_TYPES, 
        default='B2B'
    )
    annual_revenue_range = models.CharField(
        max_length=20, 
        choices=REVENUE_RANGES, 
        blank=True
    )
    founded_year = models.PositiveIntegerField(null=True, blank=True)
    
    # Contact Information
    primary_contact_phone = models.CharField(max_length=20, blank=True)
    
    # Address Information
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state_province = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenant_profiles'
    
    def __str__(self):
        return f"Profile for {self.tenant.name}"


class AdminProfile(models.Model):
    """Extended admin user profile"""
    
    DEPARTMENTS = [
        ('EXECUTIVE', 'Executive'),
        ('IT', 'Information Technology'),
        ('FINANCE', 'Finance'),
        ('MARKETING', 'Marketing'),
        ('SALES', 'Sales'),
        ('HR', 'Human Resources'),
        ('OPERATIONS', 'Operations'),
        ('OTHER', 'Other'),
    ]
    
    LANGUAGES = [
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
        ('it', 'Italian'),
        ('pt', 'Portuguese'),
        ('zh', 'Chinese'),
        ('ja', 'Japanese'),
        ('ko', 'Korean'),
    ]
    
    # Link to actual user account
    user = models.OneToOneField(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='admin_profile'
    )
    
    # Professional Information
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(
        max_length=20, 
        choices=DEPARTMENTS, 
        blank=True
    )
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Profile Information
    profile_avatar = models.ImageField(
        upload_to='admin_avatars/', 
        null=True, 
        blank=True
    )
    linkedin_profile = models.URLField(blank=True)
    
    # Preferences
    preferred_language = models.CharField(
        max_length=10, 
        choices=LANGUAGES, 
        default='en'
    )
    
    # Security Settings
    two_factor_enabled = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_profiles'
    
    def __str__(self):
        return f"Admin Profile for {self.user.get_full_name()}"


class WorkspacePreferences(models.Model):
    """Workspace preferences and settings"""
    
    CURRENCIES = [
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('CAD', 'Canadian Dollar'),
        ('AUD', 'Australian Dollar'),
        ('JPY', 'Japanese Yen'),
        ('CNY', 'Chinese Yuan'),
        ('INR', 'Indian Rupee'),
    ]
    
    NUMBER_FORMATS = [
        ('US', '1,234.56'),
        ('EU', '1.234,56'),
        ('SPACE', '1 234,56'),
        ('INDIAN', '1,23,456.78'),
    ]
    
    WEEK_DAYS = [
        ('MONDAY', 'Monday'),
        ('SUNDAY', 'Sunday'),
        ('SATURDAY', 'Saturday'),
    ]
    
    tenant = models.OneToOneField(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='workspace_preferences'
    )
    
    # Localization
    currency = models.CharField(
        max_length=10, 
        choices=CURRENCIES, 
        default='USD'
    )
    number_format = models.CharField(
        max_length=10, 
        choices=NUMBER_FORMATS, 
        default='US'
    )
    first_day_of_week = models.CharField(
        max_length=10, 
        choices=WEEK_DAYS, 
        default='MONDAY'
    )
    
    # Working Hours
    work_start_time = models.TimeField(default='09:00')
    work_end_time = models.TimeField(default='17:00')
    work_days = models.JSONField(
        default=list,
        help_text="List of working days (0=Monday, 6=Sunday)"
    )
    
    # Security & Session
    auto_logout_minutes = models.PositiveIntegerField(
        default=480,  # 8 hours
        help_text="Auto logout after inactivity (minutes)"
    )
    
    # Feature Preferences
    enabled_modules = models.JSONField(
        default=list,
        help_text="List of enabled module names"
    )
    
    # Integration Settings
    email_provider = models.CharField(max_length=50, blank=True)
    calendar_integration_enabled = models.BooleanField(default=False)
    slack_integration_enabled = models.BooleanField(default=False)
    
    # Data Management
    data_retention_days = models.PositiveIntegerField(default=365)
    backup_frequency = models.CharField(
        max_length=20,
        choices=[
            ('DAILY', 'Daily'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
        ],
        default='WEEKLY'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_default_work_days(self):
        """Get default working days (Monday-Friday)"""
        return [0, 1, 2, 3, 4]  # Monday to Friday
    
    def save(self, *args, **kwargs):
        # Set default work days if not provided
        if not self.work_days:
            self.work_days = self.get_default_work_days()
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'workspace_preferences'
    
    def __str__(self):
        return f"Workspace Preferences for {self.tenant.name}"


class OnboardingProgress(models.Model):
    """Enhanced onboarding progress tracking"""
    
    STEPS = [
        ('EMAIL_INVITATION', 'Email Invitation'),
        ('PROFILE_SETUP', 'Profile Setup'),
        ('COMPANY_DETAILS', 'Company Details'),
        ('PREFERENCES', 'Preferences'),
        ('COMPLETE', 'Complete'),
    ]
    
    tenant = models.OneToOneField(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='onboarding_progress'
    )
    
    # Step Completion Tracking
    current_step = models.CharField(
        max_length=20, 
        choices=STEPS, 
        default='EMAIL_INVITATION'
    )
    completed_steps = models.JSONField(
        default=list,
        help_text="List of completed step names"
    )
    
    # Step Data Storage (for editing)
    step_data = models.JSONField(
        default=dict,
        help_text="Stored data for each step"
    )
    
    # Progress Metrics
    completion_percentage = models.PositiveIntegerField(default=0)
    total_steps = models.PositiveIntegerField(default=4)  # Actual onboarding steps (excluding COMPLETE)
    
    
    # Timing Information
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Session Management
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    def mark_step_completed(self, step_name, step_data=None):
        """Mark a step as completed and update progress"""
        if step_name not in self.completed_steps:
            self.completed_steps.append(step_name)
        
        if step_data:
            self.step_data[step_name] = step_data
        
        # Update completion percentage based on total steps (excluding COMPLETE)
        completed_count = len([step for step in self.completed_steps if step != 'COMPLETE'])
        self.completion_percentage = min(100, (completed_count / self.total_steps) * 100)
        
        # Set current step to next incomplete step
        for step_code, step_name_display in self.STEPS:
            if step_code not in self.completed_steps and step_code != 'COMPLETE':
                self.current_step = step_code
                break
        else:
            # All steps completed
            self.current_step = 'COMPLETE'
            if not self.completed_at:
                from django.utils import timezone
                self.completed_at = timezone.now()
                # Update tenant status when onboarding is truly completed
                self.tenant.onboarding_status = self.tenant.OnboardingStatus.COMPLETED
                self.tenant.onboarding_completed_at = timezone.now()
                self.tenant.save()
        
        self.save()
    
    def get_step_data(self, step_name):
        """Get stored data for a specific step"""
        return self.step_data.get(step_name, {})
    
    def is_step_completed(self, step_name):
        """Check if a step is completed"""
        return step_name in self.completed_steps
    
    def can_edit_step(self, step_name):
        """Check if a step can be edited"""
        # Can edit if step is completed or is the current step
        return (step_name in self.completed_steps or 
                step_name == self.current_step)
    
    
    class Meta:
        db_table = 'onboarding_progress'
    
    def __str__(self):
        return f"Onboarding Progress for {self.tenant.name} ({self.completion_percentage}%)"