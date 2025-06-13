#!/usr/bin/env python
"""
Simple test script to verify JWT token forwarding implementation.
"""
import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.dirname(__file__))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from utils.auth_utils import get_jwt_token_from_request, create_auth_header, is_valid_jwt_format
from django.http import HttpRequest


def test_jwt_extraction():
    """Test JWT token extraction from various request scenarios."""
    print("Testing JWT token extraction utility...")
    
    # Test 1: Valid Bearer token
    request = HttpRequest()
    request.META['HTTP_AUTHORIZATION'] = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.signature'
    token = get_jwt_token_from_request(request)
    assert token == 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.signature'
    print("✓ Valid Bearer token extraction works")
    
    # Test 2: No Authorization header
    request = HttpRequest()
    token = get_jwt_token_from_request(request)
    assert token is None
    print("✓ Missing Authorization header handled correctly")
    
    # Test 3: Malformed Authorization header
    request = HttpRequest()
    request.META['HTTP_AUTHORIZATION'] = 'Bearer'
    token = get_jwt_token_from_request(request)
    assert token is None
    print("✓ Malformed Authorization header handled correctly")
    
    # Test 4: Non-Bearer authorization
    request = HttpRequest()
    request.META['HTTP_AUTHORIZATION'] = 'Basic dXNlcjpwYXNz'
    token = get_jwt_token_from_request(request)
    assert token is None
    print("✓ Non-Bearer authorization handled correctly")
    
    # Test 5: Auth header creation
    header = create_auth_header('test.jwt.token')
    assert header == 'Bearer test.jwt.token'
    print("✓ Auth header creation works")
    
    # Test 6: JWT format validation
    valid_jwt = is_valid_jwt_format('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.signature')
    assert valid_jwt == True
    print("✓ Valid JWT format detection works")
    
    invalid_jwt = is_valid_jwt_format('invalid.token')
    assert invalid_jwt == False
    print("✓ Invalid JWT format detection works")
    
    print("\n🎉 All JWT utility tests passed!")


def test_maglabs_service_initialization():
    """Test MagLabsService initialization with auth tokens."""
    print("\nTesting MagLabsService initialization...")
    
    from services.ai_services.maglabs_service import MagLabsService
    
    # Test without auth token
    service1 = MagLabsService()
    assert service1.auth_token is None
    print("✓ MagLabsService initializes without auth token")
    
    # Test with auth token
    test_token = "test.jwt.token"
    service2 = MagLabsService(auth_token=test_token)
    assert service2.auth_token == test_token
    print("✓ MagLabsService initializes with auth token")
    
    print("🎉 MagLabsService initialization tests passed!")


def test_jwt_configuration():
    """Test JWT configuration synchronization."""
    print("\nTesting JWT configuration...")
    
    from django.conf import settings
    
    # Check if SIMPLE_JWT has SIGNING_KEY configured
    assert hasattr(settings, 'SIMPLE_JWT')
    assert 'SIGNING_KEY' in settings.SIMPLE_JWT
    print("✓ SIMPLE_JWT SIGNING_KEY is configured")
    
    signing_key = settings.SIMPLE_JWT['SIGNING_KEY']
    expected_default = "change-this-in-production-to-a-secure-random-string"
    assert signing_key == expected_default
    print(f"✓ JWT signing key matches expected default: {signing_key}")
    
    print("🎉 JWT configuration tests passed!")


if __name__ == "__main__":
    print("Starting JWT token forwarding implementation tests...\n")
    
    try:
        test_jwt_extraction()
        test_maglabs_service_initialization()
        test_jwt_configuration()
        
        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED! JWT token forwarding is ready.")
        print("="*60)
        print("\nNext steps:")
        print("1. Ensure MagLabs VLLM API is running with JWT_SECRET configured")
        print("2. Test with actual JWT tokens from frontend")
        print("3. Verify Authorization headers reach MagLabs API")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)