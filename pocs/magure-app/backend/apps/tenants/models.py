# backend/customers/models.py

from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Tenant(TenantMixin):
    """
    Represents a single customer/tenant. By subclassing TenantMixin,
    calling tenant.save() will automatically create a new PostgreSQL schema
    and run all of your TENANT_APPS migrations there.
    """
    name = models.CharField(max_length=255, unique=True)
    paid_until = models.DateField(null=True, blank=True)  # optional
    on_trial = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # TenantMixin already adds a `schema_name` field under the hood.
    # You can override it if you like, but typically you let TenantMixin handle it.

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Maps a hostname (e.g. “acme.localhost”) to a Tenant. By subclassing DomainMixin,
    your “domain” field and foreign‐key to Tenant are provided automatically.
    """
    pass
