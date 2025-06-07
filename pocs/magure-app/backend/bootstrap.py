#!/usr/bin/env python3
"""
bootstrap.py

Ensures that:
  1) The “public” tenant exists (schema_name='public').
  2) There is a Domain row admin.localhost → public.
  3) A superadmin user exists in the public schema.
  4) For every other tenant, ensure their primary Domain exists
     and that there is at least one tenant‐admin user in that schema.

Run it like:
    $ cd backend
    $ source .venv/bin/activate
    $ ./bootstrap.py
"""

import os
import sys
import django
from datetime import datetime

# ─── Set up Django environment ─────────────────────────────────────────────────
# (Assumes this file lives next to manage.py)
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# ─── Imports ────────────────────────────────────────────────────────────────────
from django_tenants.utils import get_public_schema_name, schema_context
from django.contrib.auth import get_user_model
from apps.tenants.models import Tenant, Domain
from django.db import transaction, IntegrityError

User = get_user_model()

# ─── Configuration Constants ─────────────────────────────────────────────────────
PUBLIC_SCHEMA = get_public_schema_name()  # usually "public"
PUBLIC_DOMAIN  = "admin.localhost"
SUPERADMIN_USERNAME = "superadmin@admin.localhost"
SUPERADMIN_PASSWORD = "ChangeMe123!"  # <-- choose a secure default or read from env
SUPERADMIN_ROLE = "superadmin"       # must match your User.role field

# Tenant‐admin defaults for new tenants:
TENANT_ADMIN_PASSWORD = "TenantAdmin123!"  # default password for bootstrap tenant admins
TENANT_ADMIN_ROLE     = "tenant_admin"


def ensure_public_tenant():
    """
    1) Create or get a Tenant row with schema_name=PUBLIC_SCHEMA.
    2) Create or get Domain row PUBLIC_DOMAIN → public.
    3) Under public schema, ensure SUPERADMIN_USERNAME exists as a super_admin user.
    """
    created = False
    try:
        public_tenant, created = Tenant.objects.get_or_create(
            schema_name=PUBLIC_SCHEMA,
            defaults={
                "name": "Public Tenant",
            },
        )
        if created:
            print(f"[+] Created Tenant(schema_name='{PUBLIC_SCHEMA}')")
        else:
            print(f"[ ] Tenant(schema_name='{PUBLIC_SCHEMA}') already exists")
    except IntegrityError as e:
        print(f"[!] ERROR creating/fetching public Tenant: {e}")
        sys.exit(1)

    # 2) Create (or get) Domain “admin.localhost → public”
    try:
        domain, domain_created = Domain.objects.get_or_create(
            domain=PUBLIC_DOMAIN,
            defaults={"tenant": public_tenant, "is_primary": True},
        )
        if domain_created:
            print(f"[+] Created Domain(domain='{PUBLIC_DOMAIN}', tenant=public)")
        else:
            # If it existed but points to wrong tenant, fix it:
            if domain.tenant_id != public_tenant.id:
                domain.tenant = public_tenant
                domain.is_primary = True
                domain.save()
                print(f"[>] Re‐assigned '{PUBLIC_DOMAIN}' → public Tenant")
            else:
                print(f"[ ] Domain(domain='{PUBLIC_DOMAIN}') already exists")
    except IntegrityError as e:
        print(f"[!] ERROR creating/fetching Domain '{PUBLIC_DOMAIN}': {e}")
        sys.exit(1)

    # 3) Under public schema, ensure superadmin user exists
    with schema_context(PUBLIC_SCHEMA):
        try:
            super_u = User.objects.filter(username=SUPERADMIN_USERNAME).first()
            if super_u:
                print(f"[ ] Super‐admin '{SUPERADMIN_USERNAME}' already exists in public schema")
            else:
                User.objects.create_superuser(
                    username=SUPERADMIN_USERNAME,
                    email=SUPERADMIN_USERNAME,
                    password=SUPERADMIN_PASSWORD,
                    role=SUPERADMIN_ROLE,
                )
                print(f"[+] Created super‐admin '{SUPERADMIN_USERNAME}' in public schema")
        except Exception as e:
            print(f"[!] ERROR creating superadmin: {e}")
            sys.exit(1)


def ensure_each_tenant():
    """
    For every tenant (excluding public):
      - Ensure it has a primary Domain (subdomain.localhost).
      - Ensure there is at least one tenant‐admin user under that schema.
    """
    all_tenants = Tenant.objects.exclude(schema_name=PUBLIC_SCHEMA)
    for tenant in all_tenants:
        schema = tenant.schema_name
        domain_name = None

        # Attempt to find a primary Domain row; if missing, create one.
        existing_domain = tenant.domain_set.filter(is_primary=True).first() if hasattr(tenant, "domain_set") else None
        if existing_domain:
            domain_name = existing_domain.domain
            print(f"[ ] Tenant '{schema}': found primary domain '{domain_name}'")
        else:
            # By convention: <schema>.localhost
            domain_name = f"{schema}.localhost"
            try:
                Domain.objects.create(domain=domain_name, tenant=tenant, is_primary=True)
                print(f"[+] Created Domain(domain='{domain_name}', tenant='{schema}')")
            except IntegrityError as e:
                print(f"[!] ERROR creating domain '{domain_name}' for tenant '{schema}': {e}")
                continue

        # 2) Under that tenant's schema, ensure at least one tenant_admin exists.
        with schema_context(schema):
            admins = User.objects.filter(role=TENANT_ADMIN_ROLE, is_active=True)
            if admins.exists():
                print(f"[ ] Tenant '{schema}': existing tenant_admin(s) found ({admins.count()})")
            else:
                # If none exist, create a default one:
                default_email = f"{schema}-admin@{domain_name}"
                try:
                    User.objects.create_user(
                        username=default_email,
                        email=default_email,
                        password=TENANT_ADMIN_PASSWORD,
                        role=TENANT_ADMIN_ROLE,
                        is_staff=True,
                        is_superuser=False,
                    )
                    print(f"[+] Created default tenant_admin '{default_email}' in schema '{schema}'")
                except IntegrityError as e:
                    print(f"[!] ERROR creating tenant_admin in '{schema}': {e}")
                    continue


if __name__ == "__main__":
    print("Bootstrapping public + tenant schemas…")
    ensure_public_tenant()
    ensure_each_tenant()
    print("✅ Bootstrap complete.")
