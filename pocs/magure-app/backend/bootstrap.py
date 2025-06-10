#!/usr/bin/env python3

import os
import sys
import subprocess
import django
from datetime import datetime

# ─── Set up Django environment ─────────────────────────────────────────────
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# ─── Imports ───────────────────────────────────────────────────────────────
from django_tenants.utils import get_public_schema_name, schema_context
from django.contrib.auth import get_user_model
from apps.tenants.models import Tenant, Domain
from django.db import IntegrityError

User = get_user_model()

# ─── Configuration Constants ───────────────────────────────────────────────
PUBLIC_SCHEMA = get_public_schema_name()
PUBLIC_DOMAIN = "admin.maglabs.api"
SUPERADMIN_USERNAME = "superadmin@admin.maglabs.api"
SUPERADMIN_PASSWORD = "ChangeMe123!"
SUPERADMIN_ROLE = "superadmin"
SUPERADMIN_SUBDOMAIN = "admin"  # used for add_hosts.sh

TENANT_NAME = "magureinc.maglabs"
TENANT_SCHEMA = "magureinc"
TENANT_DOMAIN = "magureinc.maglabs.api"
TENANT_ADMIN_EMAIL = "admin@magureinc.maglabs.api"
TENANT_ADMIN_PASSWORD = "TenantAdmin123!"
TENANT_ADMIN_ROLE = "tenant_admin"
TENANT_SUBDOMAIN = "magureinc"  # used for add_hosts.sh

# ─── Core Bootstrap Logic ──────────────────────────────────────────────────

def ensure_public_tenant():
    public_tenant, _ = Tenant.objects.get_or_create(
        schema_name=PUBLIC_SCHEMA,
        defaults={"name": "Public Tenant"},
    )

    Domain.objects.get_or_create(
        domain=PUBLIC_DOMAIN,
        defaults={"tenant": public_tenant, "is_primary": True},
    )

    with schema_context(PUBLIC_SCHEMA):
        if not User.objects.filter(username=SUPERADMIN_USERNAME).exists():
            User.objects.create_superuser(
                username=SUPERADMIN_USERNAME,
                email=SUPERADMIN_USERNAME,
                password=SUPERADMIN_PASSWORD,
                role=SUPERADMIN_ROLE,
            )
            print(f"[+] Superadmin created: {SUPERADMIN_USERNAME}")
        else:
            print(f"[ ] Superadmin already exists: {SUPERADMIN_USERNAME}")


def create_bootstrap_tenant():
    if Tenant.objects.filter(schema_name=TENANT_SCHEMA).exists():
        print(f"[ ] Tenant '{TENANT_SCHEMA}' already exists.")
        return

    print(f"[+] Creating tenant '{TENANT_SCHEMA}'…")
    tenant = Tenant.objects.create(
        name=TENANT_NAME,
        schema_name=TENANT_SCHEMA,
    )

    Domain.objects.create(
        domain=TENANT_DOMAIN,
        tenant=tenant,
        is_primary=True,
    )

    with schema_context(TENANT_SCHEMA):
        User.objects.create_user(
            username=TENANT_ADMIN_EMAIL,
            email=TENANT_ADMIN_EMAIL,
            password=TENANT_ADMIN_PASSWORD,
            role=TENANT_ADMIN_ROLE,
            is_staff=True,
            is_superuser=False,
        )
        print(f"[+] Tenant admin created: {TENANT_ADMIN_EMAIL}")


def run_shell_script(script_name, stdin_input=None):
    project_root = os.path.abspath(os.path.join(PROJECT_DIR, ".."))
    script_path = os.path.join(project_root, script_name)
    print(f"🔍 Looking for: {script_path}")
    if os.path.isfile(script_path):
        print(f"📜 Running {script_name}…")
        subprocess.run(
            ["bash", script_path],
            check=True,
            input=stdin_input if stdin_input else None,
            cwd=project_root,  # 👈 Ensures working directory is project root
            text=True
        )
    else:
        print(f"⚠️  Script {script_name} not found at {script_path}")


def stop_nginx():
    print("🛑 Stopping NGINX before making config changes...")
    subprocess.run(["sudo", "nginx", "-s", "stop"], check=False)

def start_nginx():
    print("🚀 Restarting NGINX...")
    subprocess.run(["sudo", "nginx"], check=True)

# ─── Entrypoint ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 Bootstrapping public and default tenants...")
    ensure_public_tenant()
    # create_bootstrap_tenant()

    stop_nginx()

    run_shell_script("setup-maglabs-local.sh")

    run_shell_script("add_hosts.sh", stdin_input=f"{SUPERADMIN_SUBDOMAIN}\n")
    # run_shell_script("add_hosts.sh", stdin_input=f"{TENANT_SUBDOMAIN}\n")

    print("✅ Bootstrap complete.")
