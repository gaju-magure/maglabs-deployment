#!/usr/bin/env python3
"""
Script to create an admin user for testing Supabase authentication.
This bypasses the normal user registration flow since we want admin-only registration.
"""

import asyncio
import uuid
from datetime import datetime

from app.core.supabase_client import get_supabase_async_client


async def create_admin_user():
    """Create an admin user for testing"""
    
    print("🔑 Creating admin user for testing...")
    db = await get_supabase_async_client()
    
    admin_user_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@example.com",
        "full_name": "System Administrator",
        "roles": ["Admin"],
        "department": "IT",
        "title": "System Administrator",
        "contact_number": "+1-555-0001",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    try:
        # Insert admin user
        response = await db.table("users").insert(admin_user_data).execute()
        if response.data:
            admin_user = response.data[0]
            print("✅ Admin user created successfully!")
            print(f"   - ID: {admin_user['id']}")
            print(f"   - Email: {admin_user['email']}")
            print(f"   - Roles: {admin_user['roles']}")
            print(f"   - Department: {admin_user.get('department', 'N/A')}")
            return admin_user
        else:
            print("❌ Failed to create admin user")
            return None
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return None


async def create_evaluator_user():
    """Create an evaluator user for testing"""
    
    print("\n👥 Creating evaluator user for testing...")
    db = await get_supabase_async_client()
    
    evaluator_user_data = {
        "id": str(uuid.uuid4()),
        "email": "evaluator@example.com", 
        "full_name": "Jane Evaluator",
        "roles": ["Evaluator"],
        "department": "Innovation",
        "title": "Innovation Manager",
        "contact_number": "+1-555-0002",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    try:
        # Insert evaluator user
        response = await db.table("users").insert(evaluator_user_data).execute()
        if response.data:
            evaluator_user = response.data[0]
            print("✅ Evaluator user created successfully!")
            print(f"   - ID: {evaluator_user['id']}")
            print(f"   - Email: {evaluator_user['email']}")
            print(f"   - Roles: {evaluator_user['roles']}")
            print(f"   - Department: {evaluator_user.get('department', 'N/A')}")
            return evaluator_user
        else:
            print("❌ Failed to create evaluator user")
            return None
            
    except Exception as e:
        print(f"❌ Error creating evaluator user: {e}")
        return None


async def list_all_users():
    """List all users in the system"""
    
    print("\n📋 Current users in the system:")
    db = await get_supabase_async_client()
    
    try:
        response = await db.table("users").select("id, email, full_name, roles, department, title, is_active").execute()
        if response.data:
            for i, user in enumerate(response.data, 1):
                print(f"   {i}. {user['email']} ({user['full_name']})")
                print(f"      - Roles: {user['roles']}")
                print(f"      - Department: {user.get('department', 'N/A')}")
                print(f"      - Title: {user.get('title', 'N/A')}")
                print(f"      - Active: {user['is_active']}")
                print()
        else:
            print("   No users found")
            
    except Exception as e:
        print(f"❌ Error listing users: {e}")


if __name__ == "__main__":
    async def main():
        await create_admin_user()
        await create_evaluator_user()
        await list_all_users()
        
    asyncio.run(main())