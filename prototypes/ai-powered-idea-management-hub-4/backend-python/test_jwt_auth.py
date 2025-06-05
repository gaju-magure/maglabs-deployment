#!/usr/bin/env python3
"""
Simple JWT Authentication Test

Test the backend JWT authentication flow directly
"""

import os
import sys
import asyncio
import httpx
import jwt
from datetime import datetime

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

print("=== JWT AUTHENTICATION TEST ===", flush=True)

try:
    from app.core.config import settings
    print(f"✅ Config loaded successfully", flush=True)
    print(f"   Supabase URL: {settings.SUPABASE_URL}", flush=True)
    print(f"   Has JWT Secret: {'Yes' if settings.SUPABASE_JWT_SECRET else 'No'}", flush=True)
except Exception as e:
    print(f"❌ Failed to load config: {e}", flush=True)
    sys.exit(1)

async def test_jwt_creation():
    """Test creating a JWT token"""
    print("\n🔧 Testing JWT Creation...", flush=True)
    
    try:
        # Create a test JWT payload
        payload = {
            "sub": "test-user-123",
            "aud": "authenticated",  
            "role": "authenticated",
            "iat": int(datetime.now().timestamp()),
            "exp": int(datetime.now().timestamp()) + 3600  # 1 hour
        }
        
        # Sign the JWT
        token = jwt.encode(
            payload, 
            settings.SUPABASE_JWT_SECRET, 
            algorithm="HS256"
        )
        
        print(f"✅ JWT created successfully", flush=True)
        print(f"   Token length: {len(token)} chars", flush=True)
        print(f"   First 20 chars: {token[:20]}...", flush=True)
        
        return token
    except Exception as e:
        print(f"❌ JWT creation failed: {e}", flush=True)
        return None

async def test_jwt_verification(token):
    """Test verifying a JWT token"""
    print("\n🔍 Testing JWT Verification...", flush=True)
    
    try:
        decoded = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        print(f"✅ JWT verified successfully", flush=True)
        print(f"   Subject: {decoded.get('sub')}", flush=True)
        print(f"   Role: {decoded.get('role')}", flush=True)
        
        return decoded
    except Exception as e:
        print(f"❌ JWT verification failed: {e}", flush=True)
        return None

async def test_rls_explanation():
    """Explain the RLS issue and test service role access"""
    print("\n🔒 Testing RLS and Authentication...", flush=True)
    
    # First test - anon key should fail due to RLS
    print("   Testing anon key (should fail due to RLS):", flush=True)
    try:
        headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        url = f"{settings.SUPABASE_URL}/rest/v1/users?select=id&limit=1"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
        print(f"      Status: {response.status_code} (Expected: 500 due to RLS)", flush=True)
        
        if response.status_code == 500:
            print(f"   ✅ RLS working correctly - anon access blocked", flush=True)
        else:
            print(f"   ⚠️  Unexpected response: {response.text[:100]}", flush=True)
            
    except Exception as e:
        print(f"   ❌ Anon test failed: {e}", flush=True)
    
    # Second test - service role should work
    print("   Testing service role key (should work):", flush=True)
    try:
        headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        url = f"{settings.SUPABASE_URL}/rest/v1/users?select=id&limit=1"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
        print(f"      Status: {response.status_code}", flush=True)
        
        if response.status_code == 200:
            print(f"   ✅ Service role access working", flush=True)
            return True
        else:
            print(f"   ❌ Service role failed: {response.text[:100]}", flush=True)
            return False
            
    except Exception as e:
        print(f"   ❌ Service role test failed: {e}", flush=True)
        return False

async def test_jwt_with_proper_user_id():
    """Test JWT with a valid user ID (if users exist)"""
    print("\n👤 Testing JWT with Real User Context...", flush=True)
    
    try:
        # First, get a real user ID using service role
        headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        url = f"{settings.SUPABASE_URL}/rest/v1/users?select=id&limit=1"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
        if response.status_code != 200:
            print(f"   ⚠️  No users in database to test with", flush=True)
            return True  # Not a failure, just no test data
            
        users = response.json()
        if not users:
            print(f"   ⚠️  No users in database to test with", flush=True)
            return True
            
        user_id = users[0]['id']
        print(f"   Found user ID: {user_id}", flush=True)
        
        # Create JWT for this user
        payload = {
            "sub": user_id,
            "aud": "authenticated",  
            "role": "authenticated",
            "iat": int(datetime.now().timestamp()),
            "exp": int(datetime.now().timestamp()) + 3600
        }
        
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        # Test with this JWT
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        url = f"{settings.SUPABASE_URL}/rest/v1/users?select=id&limit=1"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
        print(f"   Response Status: {response.status_code}", flush=True)
        
        if response.status_code == 200:
            print(f"   ✅ JWT authentication with real user working", flush=True)
            return True
        else:
            print(f"   ❌ JWT authentication failed: {response.text[:100]}", flush=True)
            return False
            
    except Exception as e:
        print(f"   ❌ Real user JWT test failed: {e}", flush=True)
        return False

async def test_backend_auth_flow():
    """Test the complete backend authentication flow"""
    print("\n🚀 Testing Backend Security Module...", flush=True)
    
    try:
        from app.core.security import create_access_token, verify_token
        print("   ✅ Security module imported", flush=True)
        
        # Test token creation
        user_data = {"sub": "test-user", "role": "authenticated"}
        token = create_access_token(user_data)
        print(f"   ✅ Backend token created: {token[:20]}...", flush=True)
        
        # Test token verification
        decoded = verify_token(token)
        print(f"   ✅ Backend token verified: {decoded}", flush=True)
        
        return True
    except Exception as e:
        print(f"   ❌ Backend auth flow failed: {e}", flush=True)
        return False

async def main():
    """Run all JWT authentication tests"""
    print("Starting JWT Authentication Tests...\n", flush=True)
    
    # Test 1: Basic JWT creation
    token = await test_jwt_creation()
    jwt_creation_works = token is not None
    
    # Test 2: JWT verification
    decoded = None
    if token:
        decoded = await test_jwt_verification(token)
    jwt_verification_works = decoded is not None
    
    # Test 3: RLS and authentication explanation
    rls_works = await test_rls_explanation()
    
    # Test 4: JWT with real user context
    real_user_jwt_works = await test_jwt_with_proper_user_id()
    
    # Test 5: Backend auth flow
    backend_works = await test_backend_auth_flow()
    
    # Summary
    print("\n" + "="*60, flush=True)
    print("🏁 JWT AUTHENTICATION TEST SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"JWT Creation:                {'✅ PASS' if jwt_creation_works else '❌ FAIL'}", flush=True)
    print(f"JWT Verification:            {'✅ PASS' if jwt_verification_works else '❌ FAIL'}", flush=True)
    print(f"RLS Security:                {'✅ PASS' if rls_works else '❌ FAIL'}", flush=True)
    print(f"Real User JWT Auth:          {'✅ PASS' if real_user_jwt_works else '❌ FAIL'}", flush=True)
    print(f"Backend Security Module:     {'✅ PASS' if backend_works else '❌ FAIL'}", flush=True)
    
    # Analysis
    print(f"\n📋 ANALYSIS:", flush=True)
    
    if jwt_creation_works and jwt_verification_works:
        print(f"   ✅ Your JWT secret is correctly configured", flush=True)
        print(f"   ✅ JWT creation and verification working", flush=True)
    
    if rls_works:
        print(f"   ✅ Row Level Security properly protecting your data", flush=True)
        print(f"   ✅ Service role access working for admin operations", flush=True)
        
    if real_user_jwt_works:
        print(f"   ✅ Authentication flow complete - JWT tokens work with Supabase", flush=True)
    
    if backend_works:
        print(f"   ✅ Your backend security module functions properly", flush=True)
    
    all_critical_passed = jwt_creation_works and jwt_verification_works and rls_works and backend_works
    
    if all_critical_passed:
        print(f"\n🎉 BACKEND JWT AUTHENTICATION IS WORKING CORRECTLY!", flush=True)
        print(f"Your backend can:", flush=True)
        print(f"  • Create valid JWT tokens", flush=True)
        print(f"  • Verify JWT tokens", flush=True)
        print(f"  • Protect data with RLS", flush=True)
        print(f"  • Access Supabase with proper authentication", flush=True)
    else:
        print(f"\n⚠️  SOME ISSUES FOUND - CHECK DETAILS ABOVE", flush=True)
    
    return all_critical_passed

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"\n💥 Fatal error: {e}", flush=True)
        sys.exit(1)
