# backend/customers/models.py

import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django_tenants.models import TenantMixin, DomainMixin

class Tenant(TenantMixin):
    """
    Represents a single customer/tenant. By subclassing TenantMixin,
    calling tenant.save() will automatically create a new PostgreSQL schema
    and run all of your TENANT_APPS migrations there.
    """
    class OnboardingStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
    
    name = models.CharField(max_length=255, unique=True)
    paid_until = models.DateField(null=True, blank=True)
    on_trial = models.BooleanField(default=True)
    
    # Onboarding fields
    onboarding_status = models.CharField(
        max_length=20,
        choices=OnboardingStatus.choices,
        default=OnboardingStatus.PENDING
    )
    admin_email = models.EmailField(null=True, blank=True)
    onboarding_token = models.UUIDField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    onboarding_completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_onboarding_token(self):
        """Generate a new onboarding token with expiration"""
        self.onboarding_token = uuid.uuid4()
        self.token_expires_at = timezone.now() + timedelta(days=2)
        self.save()
        return self.onboarding_token
    
    def is_onboarding_token_valid(self):
        """Check if onboarding token is still valid"""
        if not self.token_expires_at:
            return False
        return timezone.now() < self.token_expires_at
    
    def complete_onboarding(self):
        """Mark onboarding as completed"""
        self.onboarding_status = self.OnboardingStatus.COMPLETED
        self.onboarding_completed_at = timezone.now()
        self.token_expires_at = None
        self.save()

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Maps a hostname (e.g. “acme.localhost”) to a Tenant. By subclassing DomainMixin,
    your “domain” field and foreign‐key to Tenant are provided automatically.
    """
    pass


class TenantOnboarding(models.Model):
    """
    Tracks the onboarding process for tenants with step-by-step progress
    """
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='onboarding')
    
    # Onboarding steps
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    profile_setup_completed = models.BooleanField(default=False)
    profile_setup_completed_at = models.DateTimeField(null=True, blank=True)
    
    company_details_completed = models.BooleanField(default=False)
    company_details_completed_at = models.DateTimeField(null=True, blank=True)
    
    preferences_completed = models.BooleanField(default=False)
    preferences_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Completion tracking
    completed_steps = models.PositiveIntegerField(default=0)
    total_steps = models.PositiveIntegerField(default=4)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage"""
        if self.total_steps == 0:
            return 0
        return (self.completed_steps / self.total_steps) * 100
    
    def update_progress(self):
        """Update the completed steps count"""
        steps = [
            self.email_sent,
            self.profile_setup_completed,
            self.company_details_completed,
            self.preferences_completed
        ]
        self.completed_steps = sum(steps)
        self.save()
    
    def mark_step_completed(self, step_name):
        """Mark a specific step as completed"""
        if step_name == 'email_sent' and not self.email_sent:
            self.email_sent = True
            self.email_sent_at = timezone.now()
        elif step_name == 'profile_setup' and not self.profile_setup_completed:
            self.profile_setup_completed = True
            self.profile_setup_completed_at = timezone.now()
        elif step_name == 'company_details' and not self.company_details_completed:
            self.company_details_completed = True
            self.company_details_completed_at = timezone.now()
        elif step_name == 'preferences' and not self.preferences_completed:
            self.preferences_completed = True
            self.preferences_completed_at = timezone.now()
        
        self.update_progress()
        
        # Check if all steps are completed
        if self.completed_steps == self.total_steps:
            self.tenant.complete_onboarding()
    
    def __str__(self):
        return f"Onboarding for {self.tenant.name} ({self.completion_percentage:.0f}%)"
