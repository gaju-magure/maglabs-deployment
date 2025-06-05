#!/usr/bin/env python3
"""
Supabase Configuration Validator

This script validates all aspects of Supabase configuration for the AI-Powered Idea Management Hub.
Checks environment variables, connectivity, JWT configuration, and basic functionality.
"""

import asyncio
import json
import os
import sys
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin

import httpx
import jwt
from jwt import PyJWKClient
from pydantic import ValidationError

# Add the app directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.supabase_client import get_supabase_async_client


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'


class ValidationResult:
    """Container for validation test results"""
    
    def __init__(self):
        self.tests: List[Tuple[str, bool, str]] = []
        self.warnings: List[str] = []
        
    def add_test(self, name: str, passed: bool, details: str = ""):
        """Add a test result"""
        self.tests.append((name, passed, details))
        
    def add_warning(self, message: str):
        """Add a warning message"""
        self.warnings.append(message)
        
    def print_results(self):
        """Print formatted results"""
        print(f"\n{Colors.BOLD}🔍 SUPABASE CONFIGURATION VALIDATION REPORT{Colors.END}")
        print("=" * 60)
        
        passed_count = sum(1 for _, passed, _ in self.tests if passed)
        total_count = len(self.tests)
        
        for name, passed, details in self.tests:
            status_color = Colors.GREEN if passed else Colors.RED
            status_symbol = "✅" if passed else "❌"
            print(f"{status_symbol} {status_color}{name}{Colors.END}")
            if details:
                print(f"   {Colors.CYAN}{details}{Colors.END}")
        
        if self.warnings:
            print(f"\n{Colors.YELLOW}⚠️  WARNINGS:{Colors.END}")
            for warning in self.warnings:
                print(f"   {Colors.YELLOW}• {warning}{Colors.END}")
        
        print(f"\n{Colors.BOLD}SUMMARY:{Colors.END}")
        print(f"   Tests Passed: {Colors.GREEN}{passed_count}{Colors.END}")
        print(f"   Tests Failed: {Colors.RED}{total_count - passed_count}{Colors.END}")
        print(f"   Total Tests: {total_count}")
        
        if passed_count == total_count:
            print(f"\n{Colors.GREEN}🎉 ALL TESTS PASSED! Your Supabase configuration is valid.{Colors.END}")
            return True
        else:
            print(f"\n{Colors.RED}❌ VALIDATION FAILED! Please fix the issues above.{Colors.END}")
            return False


class SupabaseValidator:
    """Main validation class for Supabase configuration"""
    
    def __init__(self):
        self.result = ValidationResult()
        self.client = None
        
    async def validate_all(self) -> bool:
        """Run all validation tests"""
        print(f"{Colors.BOLD}🚀 Starting Supabase Configuration Validation...{Colors.END}\n")
        
        # Environment validation
        await self.validate_environment()
        
        # Connectivity validation
        await self.validate_connectivity()
        
        # JWT validation
        await self.validate_jwt_configuration()
        
        # Database connectivity
        await self.validate_database_connectivity()
        
        # Authentication endpoints
        await self.validate_auth_endpoints()
        
        return self.result.print_results()
    
    async def validate_environment(self):
        """Validate environment variables and configuration"""
        print(f"{Colors.BLUE}📋 Validating Environment Configuration...{Colors.END}")
        
        # Required environment variables
        required_vars = [
            ('SUPABASE_URL', 'Supabase project URL'),
            ('SUPABASE_ANON_KEY', 'Supabase anonymous key'),
            ('SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key'),
            ('SUPABASE_JWT_SECRET', 'JWT secret for token validation'),
        ]
        
        for var_name, description in required_vars:
            try:
                value = getattr(settings, var_name)
                if value:
                    # Mask sensitive values in output
                    masked_value = f"{str(value)[:8]}..." if 'KEY' in var_name or 'SECRET' in var_name else str(value)
                    self.result.add_test(
                        f"Environment Variable: {var_name}",
                        True,
                        f"{description} - Present ({masked_value})"
                    )
                else:
                    self.result.add_test(
                        f"Environment Variable: {var_name}",
                        False,
                        f"{description} - Missing or empty"
                    )
            except AttributeError:
                self.result.add_test(
                    f"Environment Variable: {var_name}",
                    False,
                    f"{description} - Not configured"
                )
        
        # Validate URL format
        try:
            url_str = str(settings.SUPABASE_URL)
            if url_str.startswith('https://') and '.supabase.co' in url_str:
                self.result.add_test(
                    "Supabase URL Format",
                    True,
                    f"Valid Supabase URL format: {url_str}"
                )
            else:
                self.result.add_test(
                    "Supabase URL Format",
                    False,
                    f"Invalid URL format. Expected https://[project-id].supabase.co, got: {url_str}"
                )
        except Exception as e:
            self.result.add_test(
                "Supabase URL Format",
                False,
                f"Error validating URL: {e}"
            )
        
        # Check CORS configuration
        if settings.BACKEND_CORS_ORIGINS:
            self.result.add_test(
                "CORS Configuration",
                True,
                f"CORS origins configured: {len(settings.BACKEND_CORS_ORIGINS)} origins"
            )
        else:
            self.result.add_warning("CORS origins not configured - all origins will be allowed")
    
    async def validate_connectivity(self):
        """Validate basic connectivity to Supabase"""
        print(f"{Colors.BLUE}🌐 Validating Supabase Connectivity...{Colors.END}")
        
        async with httpx.AsyncClient() as client:
            # Test basic API connectivity
            try:
                response = await client.get(
                    str(settings.SUPABASE_URL),
                    timeout=10.0
                )
                self.result.add_test(
                    "Supabase API Connectivity",
                    response.status_code < 400,
                    f"HTTP {response.status_code} - {response.reason_phrase}"
                )
            except Exception as e:
                self.result.add_test(
                    "Supabase API Connectivity",
                    False,
                    f"Connection failed: {e}"
                )
            
            # Test REST API endpoint
            try:
                rest_url = urljoin(str(settings.SUPABASE_URL), "rest/v1/")
                response = await client.get(
                    rest_url,
                    headers={
                        "apikey": settings.SUPABASE_ANON_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}"
                    },
                    timeout=10.0
                )
                self.result.add_test(
                    "REST API Endpoint",
                    response.status_code in [200, 404],  # 404 is OK, means endpoint exists
                    f"REST API accessible: HTTP {response.status_code}"
                )
            except Exception as e:
                self.result.add_test(
                    "REST API Endpoint",
                    False,
                    f"REST API test failed: {e}"
                )
    
    async def validate_jwt_configuration(self):
        """Validate JWT configuration and JWKS endpoint"""
        print(f"{Colors.BLUE}🔐 Validating JWT Configuration...{Colors.END}")
        
        # Test JWKS endpoint
        jwks_url = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/.well-known/jwks.json"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(jwks_url, timeout=10.0)
                if response.status_code == 200:
                    jwks_data = response.json()
                    keys = jwks_data.get('keys', [])
                    self.result.add_test(
                        "JWKS Endpoint Accessibility",
                        len(keys) > 0,
                        f"JWKS endpoint accessible with {len(keys)} keys"
                    )
                    
                    # Test PyJWKClient initialization
                    try:
                        jwks_client = PyJWKClient(jwks_url)
                        self.result.add_test(
                            "JWKS Client Initialization",
                            True,
                            "PyJWKClient initialized successfully"
                        )
                    except Exception as e:
                        self.result.add_test(
                            "JWKS Client Initialization",
                            False,
                            f"PyJWKClient initialization failed: {e}"
                        )
                else:
                    self.result.add_test(
                        "JWKS Endpoint Accessibility",
                        False,
                        f"JWKS endpoint returned HTTP {response.status_code}"
                    )
            except Exception as e:
                self.result.add_test(
                    "JWKS Endpoint Accessibility",
                    False,
                    f"JWKS endpoint test failed: {e}"
                )
        
        # Validate JWT secret format
        try:
            jwt_secret = settings.SUPABASE_JWT_SECRET
            if len(jwt_secret) >= 32:
                self.result.add_test(
                    "JWT Secret Length",
                    True,
                    f"JWT secret has adequate length ({len(jwt_secret)} chars)"
                )
            else:
                self.result.add_test(
                    "JWT Secret Length",
                    False,
                    f"JWT secret too short ({len(jwt_secret)} chars), should be at least 32"
                )
        except Exception as e:
            self.result.add_test(
                "JWT Secret Validation",
                False,
                f"JWT secret validation failed: {e}"
            )
    
    async def validate_database_connectivity(self):
        """Validate database connectivity and basic operations"""
        print(f"{Colors.BLUE}🗄️  Validating Database Connectivity...{Colors.END}")
        
        try:
            # Test Supabase client initialization
            client = await get_supabase_async_client()
            self.result.add_test(
                "Supabase Client Initialization",
                client is not None,
                "Supabase async client created successfully"
            )
            
            # Test basic query (should work with anon key)
            response = await client.from_("users").select("count", count="exact").limit(0).execute()
            if response and not hasattr(response, 'error'):
                self.result.add_test(
                    "Database Query Test",
                    True,
                    "Basic database query executed successfully"
                )
            else:
                error_msg = getattr(response, 'error', 'Unknown error')
                self.result.add_test(
                    "Database Query Test",
                    False,
                    f"Database query failed: {error_msg}"
                )
                
        except Exception as e:
            self.result.add_test(
                "Database Connectivity",
                False,
                f"Database connection failed: {e}"
            )
    
    async def validate_auth_endpoints(self):
        """Validate authentication-related endpoints"""
        print(f"{Colors.BLUE}🔑 Validating Authentication Endpoints...{Colors.END}")
        
        async with httpx.AsyncClient() as client:
            # Test auth endpoint
            auth_url = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/"
            
            try:
                response = await client.get(auth_url, timeout=10.0)
                self.result.add_test(
                    "Auth Endpoint Accessibility",
                    response.status_code < 500,
                    f"Auth endpoint accessible: HTTP {response.status_code}"
                )
            except Exception as e:
                self.result.add_test(
                    "Auth Endpoint Accessibility",
                    False,
                    f"Auth endpoint test failed: {e}"
                )
            
            # Test signup endpoint (should return method not allowed or similar, but endpoint exists)
            signup_url = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/signup"
            
            try:
                response = await client.post(
                    signup_url,
                    json={},  # Empty payload to test endpoint existence
                    headers={
                        "apikey": settings.SUPABASE_ANON_KEY,
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                # Any response < 500 means the endpoint exists
                self.result.add_test(
                    "Signup Endpoint Accessibility",
                    response.status_code < 500,
                    f"Signup endpoint accessible: HTTP {response.status_code}"
                )
            except Exception as e:
                self.result.add_test(
                    "Signup Endpoint Accessibility",
                    False,
                    f"Signup endpoint test failed: {e}"
                )


async def main():
    """Main validation entry point"""
    validator = SupabaseValidator()
    success = await validator.validate_all()
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
