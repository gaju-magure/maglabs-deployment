#!/usr/bin/env python3
"""
Script to create auth users in Supabase Auth system and sync with our users table.
This simulates what the frontend authentication will do.
"""

import asyncio
import uuid
from datetime import datetime

from app.core.supabase_client import get_supabase_async_client


async def create_auth_user(email: str, password: str, full_name: str, role: str = "Contributor"):
    """Create a user in Supabase Auth and sync with users table"""
    
    print(f"🔐 Creating auth user: {email}")
    db = await get_supabase_async_client()
    
    try:
        # Create user in Supabase Auth
        auth_response = await db.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Skip email confirmation for testing
            "user_metadata": {
                "full_name": full_name
            }
        })
        
        if auth_response.user:
            auth_user_id = auth_response.user.id
            print(f"✅ Auth user created with ID: {auth_user_id}")
            
            # Check if user profile already exists (from trigger)
            profile_response = await db.table("users").select("*").eq("auth_user_id", auth_user_id).execute()
            
            if profile_response.data:
                # Update existing profile with role
                profile = profile_response.data[0]
                print(f"📝 Found existing profile, updating role to {role}")
                
                update_response = await db.table("users").update({
                    "roles": [role],
                    "full_name": full_name,
                    "updated_at": datetime.now().isoformat()
                }).eq("auth_user_id", auth_user_id).execute()
                
                if update_response.data:
                    print(f"✅ Profile updated successfully")
                    return update_response.data[0]
            else:
                # Create new profile (if trigger didn't work)
                print(f"📝 Creating new user profile...")
                
                profile_data = {
                    "auth_user_id": auth_user_id,
                    "email": email,
                    "full_name": full_name,
                    "roles": [role],
                    "is_active": True,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                profile_response = await db.table("users").insert(profile_data).execute()
                
                if profile_response.data:
                    print(f"✅ Profile created successfully")
                    return profile_response.data[0]
                else:
                    print(f"❌ Failed to create profile")
                    return None
        else:
            print(f"❌ Failed to create auth user: {auth_response}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating auth user: {e}")
        return None


async def test_auth_integration():
    """Test the complete authentication flow"""
    
    print("🧪 Testing Supabase Authentication Integration")
    print("=" * 50)
    
    # Create test users with different roles
    test_users = [
        {
            "email": "alice@example.com",
            "password": "TestPassword123!",
            "full_name": "Alice Contributor",
            "role": "Contributor"
        },
        {
            "email": "bob@example.com", 
            "password": "TestPassword123!",
            "full_name": "Bob Evaluator",
            "role": "Evaluator"
        }
    ]
    
    for user_data in test_users:
        result = await create_auth_user(**user_data)
        if result:
            print(f"   Created: {result['email']} ({result['roles']})")
        print()
    
    # List all users
    print("📋 All users in the system:")
    db = await get_supabase_async_client()
    
    response = await db.table("users").select("email, full_name, roles, auth_user_id, is_active").execute()
    
    if response.data:
        for i, user in enumerate(response.data, 1):
            auth_status = "✅ Has Auth" if user.get("auth_user_id") else "❌ No Auth"
            print(f"   {i}. {user['email']} - {user['roles']} - {auth_status}")
    
    print("\n🎉 Authentication test completed!")
    print("\nTest these credentials in the frontend:")
    for user_data in test_users:
        print(f"   Email: {user_data['email']} | Password: {user_data['password']}")


if __name__ == "__main__":
    asyncio.run(test_auth_integration())