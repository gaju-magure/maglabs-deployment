#!/usr/bin/env python3

import os
import sys
import django
from datetime import datetime

# Set up Django environment
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

# Imports
from django_tenants.utils import get_public_schema_name, schema_context
from django.contrib.auth import get_user_model
from apps.tenants.models import Tenant, Domain
from django.db import IntegrityError

User = get_user_model()

# Configuration
PUBLIC_SCHEMA = get_public_schema_name()
DOMAIN_NAME = os.environ.get('DOMAIN_NAME', '3.108.58.153')
ADMIN_DOMAIN = f"admin.{DOMAIN_NAME}"
SUPERADMIN_EMAIL = "admin@maglabs.com"
SUPERADMIN_PASSWORD = "admin123"

def ensure_public_tenant():
    """Create public tenant and admin user"""
    print("🚀 Setting up public tenant...")
    
    public_tenant, created = Tenant.objects.get_or_create(
        schema_name=PUBLIC_SCHEMA,
        defaults={"name": "Public Tenant"},
    )
    
    if created:
        print(f"✅ Created public tenant")
    else:
        print(f"ℹ️ Public tenant already exists")

    # Create admin domain
    admin_domain, created = Domain.objects.get_or_create(
        domain=ADMIN_DOMAIN,
        defaults={"tenant": public_tenant, "is_primary": True},
    )
    
    if created:
        print(f"✅ Created admin domain: {ADMIN_DOMAIN}")
    else:
        print(f"ℹ️ Admin domain already exists: {ADMIN_DOMAIN}")

    # Create main domain (IP or custom domain)
    main_domain, created = Domain.objects.get_or_create(
        domain=DOMAIN_NAME,
        defaults={"tenant": public_tenant, "is_primary": False},
    )
    
    if created:
        print(f"✅ Created main domain: {DOMAIN_NAME}")
    else:
        print(f"ℹ️ Main domain already exists: {DOMAIN_NAME}")

    # Create superuser in public schema
    with schema_context(PUBLIC_SCHEMA):
        if not User.objects.filter(email=SUPERADMIN_EMAIL).exists():
            User.objects.create_superuser(
                username="admin",
                email=SUPERADMIN_EMAIL,
                password=SUPERADMIN_PASSWORD,
            )
            print(f"✅ Created superuser: {SUPERADMIN_EMAIL}")
            print(f"🔑 Login credentials: admin / {SUPERADMIN_PASSWORD}")
        else:
            print(f"ℹ️ Superuser already exists: {SUPERADMIN_EMAIL}")

def create_sample_tenant():
    """Create a sample tenant for testing"""
    tenant_schema = "demo"
    tenant_domain = f"demo.{DOMAIN_NAME}"
    
    if Tenant.objects.filter(schema_name=tenant_schema).exists():
        print(f"ℹ️ Demo tenant already exists")
        return

    print(f"🏢 Creating demo tenant...")
    tenant = Tenant.objects.create(
        name="Demo Company",
        schema_name=tenant_schema,
    )

    Domain.objects.create(
        domain=tenant_domain,
        tenant=tenant,
        is_primary=True,
    )

    with schema_context(tenant_schema):
        User.objects.create_user(
            username="demo",
            email="demo@demo.com",
            password="demo123",
            is_staff=True,
        )
        print(f"✅ Created demo tenant: {tenant_domain}")
        print(f"🔑 Demo login: demo / demo123")

if __name__ == "__main__":
    print("🚀 Bootstrapping MagLabs application...")
    
    try:
        ensure_public_tenant()
        create_sample_tenant()
        
        print("\n🎉 Bootstrap completed successfully!")
        print(f"\n🌐 Access your application:")
        print(f"   Main site: http://{DOMAIN_NAME}/")
        print(f"   Admin: http://{ADMIN_DOMAIN}/admin/")
        print(f"   Demo: http://demo.{DOMAIN_NAME}/")
        print(f"\n👤 Credentials:")
        print(f"   Admin: admin / admin123")
        print(f"   Demo: demo / demo123")
        
    except Exception as e:
        print(f"❌ Bootstrap failed: {e}")
        sys.exit(1)