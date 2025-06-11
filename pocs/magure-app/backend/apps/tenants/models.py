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
    
    Setting auto_drop_schema=True enables automatic schema deletion when
    the tenant is deleted, allowing recreation with same details.
    """
    auto_drop_schema = True
    class OnboardingStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
    
    name = models.CharField(max_length=255, unique=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )
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


class TenantDepartment(models.Model):
    """Custom departments that can be created by each tenant"""
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='custom_departments'
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Department hierarchy
    parent_department = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_departments'
    )
    
    # Department head
    department_head = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_departments'
    )
    
    class Meta:
        db_table = 'tenant_departments'
        unique_together = ['tenant', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


# Import branding models at the end to avoid circular imports
from .branding_models import (
    DefaultThemeTemplate, 
    TenantBranding, 
    TenantAsset, 
    OnboardingBrandingChoices
)
