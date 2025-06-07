from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user with a `role` field. It lives in:
      - public.accounts_user    (for superadmins or any public-level tenant_admin)
      - <tenant>.accounts_user  (for that tenant's admins/users)

    Roles:
      - superadmin    → global superuser (public schema only)
      - tenant_admin  → per-tenant admin (staff inside a tenant schema)
      - tenant_user   → regular user inside a tenant schema
    """
    ROLE_CHOICES = [
        ("superadmin",   "Super Admin"),
        ("tenant_admin", "Tenant Admin"),
        ("tenant_user",  "Tenant User"),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="tenant_user",
        help_text="'superadmin' for global; 'tenant_admin' or 'tenant_user' inside each tenant."
    )

    def is_tenant_admin(self):
        return self.role == "tenant_admin"
