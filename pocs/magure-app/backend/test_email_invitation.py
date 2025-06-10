#!/usr/bin/env python
"""
Test script to demonstrate email invitation functionality.
This script shows how the onboarding invitation system works.
"""

import os
import sys
import django

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.tenants.models import Tenant, TenantOnboarding, Domain
from services.email_service import EmailService

def test_email_invitation():
    """Test the email invitation process"""
    
    print("🧪 Testing Email Invitation System")
    print("=" * 50)
    
    # Cleanup any existing test data
    print("\n0. Cleaning up existing test data...")
    Tenant.objects.filter(schema_name="testcompany").delete()
    
    # Step 1: Create a test tenant (simulating SuperAdmin action)
    print("\n1. Creating test tenant...")
    
    tenant = Tenant.objects.create(
        name="Test Company Inc",
        schema_name="testcompany",
        admin_email="admin@testcompany.com",
        onboarding_status=Tenant.OnboardingStatus.PENDING
    )
    
    # Create domain
    Domain.objects.create(
        domain="testcompany.maglabs.local",
        tenant=tenant,
        is_primary=True
    )
    
    # Create onboarding tracker
    TenantOnboarding.objects.create(tenant=tenant)
    
    print(f"✅ Tenant created: {tenant.name}")
    print(f"   - Schema: {tenant.schema_name}")
    print(f"   - Admin Email: {tenant.admin_email}")
    print(f"   - Status: {tenant.onboarding_status}")
    
    # Step 2: Generate onboarding token
    print("\n2. Generating onboarding token...")
    
    token = tenant.generate_onboarding_token()
    print(f"✅ Token generated: {token}")
    print(f"   - Expires: {tenant.token_expires_at}")
    
    # Step 3: Test email sending
    print("\n3. Testing email invitation...")
    
    try:
        email_sent = EmailService.send_onboarding_invitation(tenant, token)
        
        if email_sent:
            print("✅ Email invitation sent successfully!")
        else:
            print("❌ Email sending failed")
            
        # Mark email as sent in onboarding tracker
        onboarding = tenant.onboarding
        onboarding.mark_step_completed('email_sent')
        
        print(f"✅ Onboarding status updated")
        print(f"   - Progress: {onboarding.completion_percentage:.0f}%")
        print(f"   - Steps completed: {onboarding.completed_steps}/{onboarding.total_steps}")
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
    
    # Step 4: Show the onboarding URL
    print("\n4. Onboarding URL:")
    primary_domain = Domain.objects.filter(tenant=tenant, is_primary=True).first()
    if primary_domain:
        onboarding_url = f"https://{primary_domain.domain}/onboarding/{token}"
        print(f"🔗 {onboarding_url}")
        print(f"\n📧 In a real scenario, this URL would be sent via email to: {tenant.admin_email}")
    
    # Step 5: Show email configuration
    print("\n5. Current Email Configuration:")
    from django.conf import settings
    print(f"   - Backend: {settings.EMAIL_BACKEND}")
    print(f"   - Host: {settings.EMAIL_HOST}")
    print(f"   - Port: {settings.EMAIL_PORT}")
    print(f"   - Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"   - From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("\n📝 NOTE: Using console email backend - emails will be printed to console")
        print("   To send real emails, configure SMTP settings in your environment:")
        print("   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")
        print("   EMAIL_HOST=smtp.gmail.com")
        print("   EMAIL_PORT=587")
        print("   EMAIL_USE_TLS=True")
        print("   EMAIL_HOST_USER=your-email@gmail.com")
        print("   EMAIL_HOST_PASSWORD=your-app-password")
    
    # Cleanup
    print(f"\n6. Cleaning up test data...")
    tenant.delete()
    print("✅ Test tenant deleted")
    
    print("\n" + "=" * 50)
    print("🎉 Email invitation test completed!")
    print("\nTo test the full flow:")
    print("1. Configure email settings (see above)")
    print("2. Run Django server: python manage.py runserver")
    print("3. Login as SuperAdmin")
    print("4. Create a tenant")
    print("5. Click 'Send Invitation' button")
    print("6. Check email/console for invitation")
    print("7. Open onboarding URL to test wizard")

if __name__ == "__main__":
    test_email_invitation()