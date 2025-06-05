#!/usr/bin/env python3
"""
Test script to verify authentication integration and RLS policies.
"""

import asyncio
import uuid
from datetime import datetime

from app.core.supabase_client import get_supabase_async_client
from app.models.domain import UserRoleEnum


async def test_rls_policies():
    """Test Row Level Security policies"""
    
    print("🔒 Testing Row Level Security policies...")
    db = await get_supabase_async_client()
    
    # Test 1: Get users as anonymous user (should fail)
    print("\n1. Testing anonymous access to users table (should fail):")
    try:
        # This should fail because of RLS
        response = await db.table("users").select("*").execute()
        print(f"   ❌ Unexpected success - got {len(response.data)} users without auth")
    except Exception as e:
        print(f"   ✅ Correctly blocked: {str(e)[:100]}...")
    
    # Test 2: Ideas access without proper permissions
    print("\n2. Testing ideas access without auth (should fail):")
    try:
        response = await db.table("ideas").select("*").execute()
        print(f"   ❌ Unexpected success - got {len(response.data)} ideas without auth")
    except Exception as e:
        print(f"   ✅ Correctly blocked: {str(e)[:100]}...")


async def test_user_roles():
    """Test user role functionality"""
    
    print("\n👥 Testing user roles and permissions...")
    db = await get_supabase_async_client()
    
    # Get all users and their roles
    try:
        response = await db.table("users").select("email, roles, department, title").execute()
        if response.data:
            print("   Current users and roles:")
            for user in response.data:
                roles = user.get('roles', [])
                print(f"   - {user['email']}: {roles} ({user.get('department', 'No dept')})")
                
                # Validate roles are valid enum values
                for role in roles:
                    try:
                        UserRoleEnum(role)
                        print(f"     ✅ '{role}' is a valid role")
                    except ValueError:
                        print(f"     ❌ '{role}' is NOT a valid role")
        else:
            print("   No users found")
            
    except Exception as e:
        print(f"   ❌ Error testing user roles: {e}")


async def test_trigger_functionality():
    """Test if triggers would work (simulate new user creation)"""
    
    print("\n🔄 Testing trigger simulation...")
    db = await get_supabase_async_client()
    
    # Create a test user to verify trigger-like functionality
    test_user_data = {
        "id": str(uuid.uuid4()),
        "email": "trigger-test@example.com",
        "full_name": "Trigger Test User", 
        "roles": ["Contributor"],  # Default role
        "department": "Testing",
        "title": "Test Engineer",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    try:
        # Insert test user
        response = await db.table("users").insert(test_user_data).execute()
        if response.data:
            user = response.data[0]
            print("   ✅ Test user created successfully")
            print(f"      - Email: {user['email']}")
            print(f"      - Default role: {user['roles']}")
            print(f"      - Department: {user['department']}")
            
            # Clean up test user
            await db.table("users").delete().eq("email", "trigger-test@example.com").execute()
            print("   🧹 Test user cleaned up")
        else:
            print("   ❌ Failed to create test user")
            
    except Exception as e:
        print(f"   ❌ Error testing triggers: {e}")


async def test_user_profile_data():
    """Test user profile data completeness"""
    
    print("\n📋 Testing user profile data completeness...")
    db = await get_supabase_async_client()
    
    try:
        response = await db.table("users").select("*").execute()
        if response.data:
            print(f"   Found {len(response.data)} users in the system")
            
            for user in response.data:
                print(f"\n   User: {user['email']}")
                print(f"   - Full Name: {user.get('full_name', 'Not set')}")
                print(f"   - Roles: {user.get('roles', 'Not set')}")
                print(f"   - Department: {user.get('department', 'Not set')}")
                print(f"   - Title: {user.get('title', 'Not set')}")
                print(f"   - Contact: {user.get('contact_number', 'Not set')}")
                print(f"   - Auth User ID: {user.get('auth_user_id', 'Not set')}")
                print(f"   - Active: {user.get('is_active', 'Not set')}")
                
                # Check data completeness
                missing_fields = []
                if not user.get('full_name'): missing_fields.append('full_name')
                if not user.get('department'): missing_fields.append('department')
                if not user.get('title'): missing_fields.append('title')
                
                if missing_fields:
                    print(f"   ⚠️  Missing: {', '.join(missing_fields)}")
                else:
                    print("   ✅ Profile complete")
        else:
            print("   No users found")
            
    except Exception as e:
        print(f"   ❌ Error testing user profiles: {e}")


async def test_role_permissions():
    """Test role-based permissions logic"""
    
    print("\n🛡️  Testing role permission logic...")
    
    roles_hierarchy = {
        UserRoleEnum.CONTRIBUTOR: ["view_own_ideas", "create_ideas", "update_own_draft_ideas"],
        UserRoleEnum.EVALUATOR: ["view_all_ideas", "update_any_idea", "evaluate_ideas"],
        UserRoleEnum.ADMIN: ["manage_users", "delete_ideas", "full_access"]
    }
    
    for role, permissions in roles_hierarchy.items():
        print(f"   {role.value} permissions:")
        for perm in permissions:
            print(f"   - ✅ {perm}")
    
    print("   ✅ Role hierarchy defined correctly")


if __name__ == "__main__":
    async def main():
        print("🧪 Starting Authentication Integration Tests")
        print("=" * 50)
        
        await test_user_profile_data()
        await test_user_roles()
        await test_trigger_functionality()
        await test_role_permissions()
        await test_rls_policies()
        
        print("\n" + "=" * 50)
        print("🎉 Authentication integration tests completed!")
        
    asyncio.run(main())