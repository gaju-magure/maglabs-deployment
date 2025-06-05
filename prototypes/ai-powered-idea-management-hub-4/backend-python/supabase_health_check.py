#!/usr/bin/env python3
"""
Quick Supabase Health Check

This script performs a fast health check of the essential Supabase configuration
and connectivity. Ideal for CI/CD pipelines and quick verification.
"""

import asyncio
import os
import sys
import time
from typing import List, Tuple

print("DEBUG: Starting script imports", flush=True)

import httpx

print("DEBUG: httpx imported", flush=True)

# Add the app directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

print("DEBUG: About to import settings", flush=True)
from app.core.config import settings
print("DEBUG: Settings imported successfully", flush=True)

print("DEBUG: About to import get_supabase_async_client", flush=True)
from app.core.supabase_client import get_supabase_async_client
print("DEBUG: get_supabase_async_client imported successfully", flush=True)


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


class HealthCheckResult:
    """Simple health check result container"""
    
    def __init__(self):
        print("DEBUG: Creating HealthCheckResult", flush=True)
        self.checks: List[Tuple[str, bool, str]] = []
        self.start_time = time.time()
        print("DEBUG: HealthCheckResult created", flush=True)
        
    def add_check(self, name: str, passed: bool, message: str = ""):
        """Add a health check result"""
        print(f"DEBUG: Adding check result: {name} = {passed}", flush=True)
        self.checks.append((name, passed, message))
        
    def print_summary(self) -> bool:
        """Print health check summary"""
        print("DEBUG: Starting print_summary", flush=True)
        duration = time.time() - self.start_time
        passed_count = sum(1 for _, passed, _ in self.checks if passed)
        total_count = len(self.checks)
        
        print(f"\n{Colors.BOLD}🩺 SUPABASE HEALTH CHECK SUMMARY{Colors.END}")
        print("=" * 50)
        
        for name, passed, message in self.checks:
            status = f"{Colors.GREEN}✅ PASS" if passed else f"{Colors.RED}❌ FAIL"
            print(f"{status}{Colors.END} {name}")
            if message:
                print(f"     {Colors.BLUE}{message}{Colors.END}")
        
        print(f"\n{Colors.BOLD}RESULTS:{Colors.END}")
        print(f"  Duration: {duration:.2f}s")
        print(f"  Passed: {Colors.GREEN}{passed_count}{Colors.END}")
        print(f"  Failed: {Colors.RED}{total_count - passed_count}{Colors.END}")
        
        if passed_count == total_count:
            print(f"\n{Colors.GREEN}🎉 ALL HEALTH CHECKS PASSED{Colors.END}")
            return True
        else:
            print(f"\n{Colors.RED}❌ HEALTH CHECK FAILED{Colors.END}")
            return False


async def check_environment() -> Tuple[bool, str]:
    """Check essential environment variables"""
    print("DEBUG: Starting check_environment", flush=True)
    try:
        required_vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_JWT_SECRET']
        missing_vars = []
        
        for var in required_vars:
            try:
                value = getattr(settings, var)
                if not value:
                    missing_vars.append(var)
            except AttributeError:
                missing_vars.append(var)
        
        if missing_vars:
            return False, f"Missing variables: {', '.join(missing_vars)}"
        else:
            return True, "All required environment variables present"
    except Exception as e:
        print(f"DEBUG: Exception in check_environment: {e}", flush=True)
        return False, f"Environment check failed: {e}"


async def check_supabase_connectivity() -> Tuple[bool, str]:
    """Check basic Supabase API connectivity"""
    print("DEBUG: Starting check_supabase_connectivity", flush=True)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                str(settings.SUPABASE_URL),
                timeout=5.0
            )
            if response.status_code < 400:
                return True, f"API accessible (HTTP {response.status_code})"
            else:
                return False, f"API returned HTTP {response.status_code}"
    except Exception as e:
        print(f"DEBUG: Exception in check_supabase_connectivity: {e}", flush=True)
        return False, f"Connectivity failed: {e}"


async def check_jwks_endpoint() -> Tuple[bool, str]:
    """Check JWKS endpoint accessibility"""
    print("DEBUG: Starting check_jwks_endpoint", flush=True)
    try:
        jwks_url = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/.well-known/jwks.json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=5.0)
            if response.status_code == 200:
                jwks_data = response.json()
                keys = jwks_data.get('keys', [])
                if keys:
                    return True, f"JWKS accessible with {len(keys)} keys"
                else:
                    return False, "JWKS endpoint returned no keys"
            else:
                return False, f"JWKS endpoint returned HTTP {response.status_code}"
    except Exception as e:
        print(f"DEBUG: Exception in check_jwks_endpoint: {e}", flush=True)
        return False, f"JWKS check failed: {e}"


async def check_database_connection() -> Tuple[bool, str]:
    """Check database connection"""
    print("DEBUG: Starting check_database_connection", flush=True)
    try:
        print("DEBUG: About to call get_supabase_async_client()", flush=True)
        client = await asyncio.wait_for(get_supabase_async_client(), timeout=15.0)
        print("DEBUG: get_supabase_async_client() completed", flush=True)
        
        # Simple query to test connectivity
        print("DEBUG: About to execute database query", flush=True)
        response = await asyncio.wait_for(
            client.from_("users").select("count", count="exact").limit(0).execute(),
            timeout=10.0
        )
        print("DEBUG: Database query completed", flush=True)
        
        if response:
            return True, "Database connection successful"
        else:
            return False, "Database query returned no response"
    except asyncio.TimeoutError:
        print("DEBUG: Timeout in check_database_connection", flush=True)
        return False, "Database connection timed out"
    except Exception as e:
        print(f"DEBUG: Exception in check_database_connection: {e}", flush=True)
        return False, f"Database connection failed: {e}"


async def check_auth_endpoint() -> Tuple[bool, str]:
    """Check authentication endpoint"""
    print("DEBUG: Starting check_auth_endpoint", flush=True)
    try:
        auth_url = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(auth_url, timeout=5.0)
            if response.status_code < 500:
                return True, f"Auth endpoint accessible (HTTP {response.status_code})"
            else:
                return False, f"Auth endpoint returned HTTP {response.status_code}"
    except Exception as e:
        print(f"DEBUG: Exception in check_auth_endpoint: {e}", flush=True)
        return False, f"Auth endpoint check failed: {e}"


async def main():
    """Run health checks"""
    print("DEBUG: Entering main() function", flush=True)
    print(f"{Colors.BOLD}🚀 Starting Supabase Health Check...{Colors.END}", flush=True)
    
    print("DEBUG: About to create HealthCheckResult", flush=True)
    health = HealthCheckResult()
    
    # Essential checks - run sequentially for debugging
    checks = [
        ("Environment Variables", check_environment),
        ("Supabase API Connectivity", check_supabase_connectivity),
        ("JWKS Endpoint", check_jwks_endpoint),
        ("Database Connection", check_database_connection),
        ("Auth Endpoint", check_auth_endpoint),
    ]
    
    print(f"DEBUG: About to run {len(checks)} checks", flush=True)
    
    # Run checks sequentially with explicit debugging
    for i, (name, check_func) in enumerate(checks, 1):
        print(f"\n{Colors.BLUE}[{i}/{len(checks)}] Running {name}...{Colors.END}", flush=True)
        
        try:
            # Add timeout wrapper for all async operations
            print(f"DEBUG: Starting {name} check", flush=True)
            passed, message = await asyncio.wait_for(check_func(), timeout=15.0)
            print(f"DEBUG: {name} check completed: {passed}", flush=True)
            health.add_check(name, passed, message)
            
            status = f"{Colors.GREEN}✅ PASSED" if passed else f"{Colors.RED}❌ FAILED"
            print(f"    {status}{Colors.END} - {message}", flush=True)
            
        except asyncio.TimeoutError:
            error_msg = f"Check timed out after 15 seconds"
            print(f"DEBUG: {name} timed out", flush=True)
            health.add_check(name, False, error_msg)
            print(f"    {Colors.RED}❌ TIMEOUT{Colors.END} - {error_msg}", flush=True)
            
        except Exception as e:
            error_msg = f"Check failed: {str(e)[:100]}"
            print(f"DEBUG: {name} failed with exception: {e}", flush=True)
            health.add_check(name, False, error_msg)
            print(f"    {Colors.RED}❌ ERROR{Colors.END} - {error_msg}", flush=True)
    
    print(f"\n{Colors.BLUE}🔄 Generating summary report...{Colors.END}", flush=True)
    
    try:
        success = health.print_summary()
        print(f"\n{Colors.BLUE}✅ Summary report completed{Colors.END}", flush=True)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Failed to generate summary: {e}{Colors.END}", flush=True)
        success = False
    
    print(f"\n{Colors.BLUE}🏁 Health check completed{Colors.END}", flush=True)
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    print("DEBUG: Script starting, about to run asyncio.run(main())", flush=True)
    try:
        asyncio.run(main())
        print("DEBUG: asyncio.run(main()) completed successfully", flush=True)
    except Exception as e:
        print(f"DEBUG: Exception in asyncio.run(main()): {e}", flush=True)
        raise
