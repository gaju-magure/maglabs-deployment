#!/usr/bin/env python
"""
Simple test script for tenant deletion functionality

This script tests that:
1. A tenant can be deleted completely (schema + models)
2. A new tenant can be created with the same details after deletion
3. Django-tenants auto_drop_schema works correctly

Usage:
    python test_simple_deletion.py
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.db import connection
from django_tenants.utils import schema_context
from apps.tenants.models import Tenant, Domain, TenantOnboarding


def check_schema_exists(schema_name):
    """Check if schema exists in database"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = %s
        """, [schema_name])
        return cursor.fetchone() is not None


def test_simple_tenant_deletion():
    """Test simple tenant deletion and recreation"""
    
    print("🧪 Testing Simple Tenant Deletion")
    print("=" * 50)
    
    # Test data
    test_name = "Test Simple Deletion"
    test_schema = "test_simple_deletion"
    test_domain = "testsimple.maglabs.api"
    test_email = "admin@testsimple.com"
    
    try:
        # Step 1: Create a test tenant
        print("Step 1: Creating test tenant...")
        tenant = Tenant.objects.create(
            schema_name=test_schema,
            name=test_name,
            admin_email=test_email,
            onboarding_status=Tenant.OnboardingStatus.COMPLETED
        )
        
        # Create domain
        Domain.objects.create(
            domain=test_domain,
            tenant=tenant,
            is_primary=True
        )
        
        # Create onboarding record
        TenantOnboarding.objects.create(
            tenant=tenant,
            email_sent=True,
            profile_setup_completed=True,
            company_details_completed=True,
            preferences_completed=True,
            completed_steps=4
        )
        
        # Add some tenant data
        with schema_context(tenant.schema_name):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            User.objects.create_user(
                username='testuser',
                email='user@testsimple.com',
                password='testpass123',
                role='tenant_user'
            )
        
        print(f"✅ Created tenant: {tenant.name} (ID: {tenant.id})")
        print(f"   Schema: {tenant.schema_name}")
        print(f"   Domain: {test_domain}")
        
        # Verify schema exists
        schema_exists_before = check_schema_exists(test_schema)
        print(f"✅ Schema exists before deletion: {schema_exists_before}")
        
        # Verify related models exist
        domain_count = Domain.objects.filter(tenant=tenant).count()
        onboarding_count = TenantOnboarding.objects.filter(tenant=tenant).count()
        print(f"✅ Related records - Domains: {domain_count}, Onboarding: {onboarding_count}")
        
        tenant_id = tenant.id
        
        # Step 2: Delete the tenant
        print("\nStep 2: Deleting tenant...")
        print(f"Auto drop schema enabled: {tenant.auto_drop_schema}")
        tenant.delete()
        print("✅ Tenant.delete() completed")
        
        # Step 3: Verify complete cleanup
        print("\nStep 3: Verifying cleanup...")
        
        # Check tenant model deletion
        tenant_exists = Tenant.objects.filter(id=tenant_id).exists()
        print(f"✅ Tenant model exists after deletion: {tenant_exists}")
        
        # Check schema deletion
        schema_exists_after = check_schema_exists(test_schema)
        print(f"✅ Schema exists after deletion: {schema_exists_after}")
        
        # Check domain deletion (should be CASCADE deleted)
        domain_exists = Domain.objects.filter(domain=test_domain).exists()
        print(f"✅ Domain exists after deletion: {domain_exists}")
        
        # Check onboarding deletion (should be CASCADE deleted)
        onboarding_exists = TenantOnboarding.objects.filter(tenant_id=tenant_id).exists()
        print(f"✅ Onboarding record exists after deletion: {onboarding_exists}")
        
        # Verify complete cleanup
        cleanup_success = (
            not tenant_exists and
            not schema_exists_after and
            not domain_exists and
            not onboarding_exists
        )
        
        if not cleanup_success:
            print("❌ Incomplete cleanup detected!")
            return False
        
        print("🎉 Complete cleanup verified!")
        
        # Step 4: Test recreation with same details
        print("\nStep 4: Testing recreation with same details...")
        
        # Create tenant with same details
        new_tenant = Tenant.objects.create(
            schema_name=test_schema,  # Same schema name
            name=test_name,           # Same name
            admin_email=test_email,   # Same email
            onboarding_status=Tenant.OnboardingStatus.PENDING
        )
        
        # Create domain with same name
        Domain.objects.create(
            domain=test_domain,       # Same domain
            tenant=new_tenant,
            is_primary=True
        )
        
        print(f"✅ Successfully recreated tenant: {new_tenant.name} (ID: {new_tenant.id})")
        print(f"   Schema: {new_tenant.schema_name}")
        print(f"   Domain: {test_domain}")
        
        # Verify new schema was created
        new_schema_exists = check_schema_exists(test_schema)
        print(f"✅ New schema created: {new_schema_exists}")
        
        # Test adding data to new tenant
        with schema_context(new_tenant.schema_name):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.create_user(
                username='newuser',
                email='newuser@testsimple.com',
                password='testpass123',
                role='tenant_admin'
            )
            user_count = User.objects.count()
        
        print(f"✅ Added user to new tenant schema. Total users: {user_count}")
        
        # Cleanup the new tenant
        print("\nStep 5: Cleaning up test tenant...")
        new_tenant.delete()
        print("✅ Test cleanup completed")
        
        print("\n" + "=" * 50)
        print("🎉 ALL TESTS PASSED!")
        print("✅ Tenant deletion works correctly")
        print("✅ Schema is automatically dropped") 
        print("✅ Related models are CASCADE deleted")
        print("✅ Can recreate tenant with same details")
        print("✅ New tenant gets fresh schema and data")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        
        # Cleanup on failure
        try:
            print("\nCleaning up after failure...")
            # Force cleanup any remaining test data
            Tenant.objects.filter(name__icontains="Test Simple").delete()
            Domain.objects.filter(domain__icontains="testsimple").delete()
            
            # Force drop schema if it still exists
            with connection.cursor() as cursor:
                cursor.execute(f'DROP SCHEMA IF EXISTS "{test_schema}" CASCADE')
            
            print("✅ Cleanup completed")
        except Exception as cleanup_error:
            print(f"⚠️  Cleanup failed: {cleanup_error}")
        
        return False


if __name__ == "__main__":
    success = test_simple_tenant_deletion()
    sys.exit(0 if success else 1)