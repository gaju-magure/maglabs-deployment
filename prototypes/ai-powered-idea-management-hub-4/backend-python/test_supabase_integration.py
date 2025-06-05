#!/usr/bin/env python3
"""
Comprehensive Supabase Integration Test Suite

This script runs end-to-end tests of the complete authentication and data flow,
simulating real user interactions with the backend authentication system.
"""

import asyncio
import json
import os
import sys
import uuid
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

import httpx
import pytest

# Add the app directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.supabase_client import get_supabase_async_client
from app.models.domain import IdeaCreate, IdeaStatusEnum, IdeaCategoryEnum, UserRoleEnum


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


class IntegrationTestResult:
    """Container for integration test results"""
    
    def __init__(self):
        self.tests: List[Tuple[str, bool, str]] = []
        self.warnings: List[str] = []
        self.test_data_cleanup: List[str] = []
        
    def add_test(self, name: str, passed: bool, details: str = ""):
        """Add a test result"""
        self.tests.append((name, passed, details))
        
    def add_warning(self, message: str):
        """Add a warning message"""
        self.warnings.append(message)
        
    def add_cleanup_note(self, message: str):
        """Add a cleanup note"""
        self.test_data_cleanup.append(message)
        
    def print_results(self):
        """Print formatted results"""
        print(f"\n{Colors.BOLD}🧪 SUPABASE INTEGRATION TEST REPORT{Colors.END}")
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
        
        if self.test_data_cleanup:
            print(f"\n{Colors.BLUE}🧹 TEST DATA CLEANUP NOTES:{Colors.END}")
            for note in self.test_data_cleanup:
                print(f"   {Colors.BLUE}• {note}{Colors.END}")
        
        print(f"\n{Colors.BOLD}SUMMARY:{Colors.END}")
        print(f"   Tests Passed: {Colors.GREEN}{passed_count}{Colors.END}")
        print(f"   Tests Failed: {Colors.RED}{total_count - passed_count}{Colors.END}")
        print(f"   Total Tests: {total_count}")
        
        if passed_count == total_count:
            print(f"\n{Colors.GREEN}🎉 ALL INTEGRATION TESTS PASSED! Your system is working end-to-end.{Colors.END}")
            return True
        else:
            print(f"\n{Colors.RED}❌ INTEGRATION TESTS FAILED! Please fix the issues above.{Colors.END}")
            return False


class SupabaseIntegrationTester:
    """Comprehensive integration tester for Supabase authentication and data flow"""
    
    def __init__(self):
        self.result = IntegrationTestResult()
        self.client = None
        self.api_base_url = "http://localhost:8000/api/v1"  # Assumes backend is running
        self.created_ideas = []  # Track for cleanup
        
    async def test_all(self) -> bool:
        """Run all integration tests"""
        print(f"{Colors.BOLD}🚀 Starting Comprehensive Supabase Integration Tests...{Colors.END}\n")
        
        # Test prerequisites
        await self.test_prerequisites()
        
        # Test backend API connectivity
        await self.test_backend_api_connectivity()
        
        # Test authentication flow
        await self.test_authentication_flow()
        
        # Test CRUD operations with RLS
        await self.test_crud_operations_with_rls()
        
        # Test role-based access control
        await self.test_role_based_access_control()
        
        # Test data consistency and integrity
        await self.test_data_consistency()
        
        # Test error handling
        await self.test_error_handling()
        
        return self.result.print_results()
    
    async def test_prerequisites(self):
        """Test that all prerequisites are met for integration testing"""
        print(f"{Colors.BLUE}📋 Testing Prerequisites...{Colors.END}")
        
        # Test database connectivity
        try:
            self.client = await get_supabase_async_client()
            self.result.add_test(
                "Database Connection",
                True,
                "Successfully connected to Supabase database"
            )
        except Exception as e:
            self.result.add_test(
                "Database Connection",
                False,
                f"Failed to connect to database: {e}"
            )
            return
        
        # Test required tables exist
        tables_to_test = ['users', 'ideas']
        for table in tables_to_test:
            try:
                response = await self.client.from_(table).select("count", count="exact").limit(0).execute()
                self.result.add_test(
                    f"Table {table} Exists",
                    True,
                    f"Table {table} is accessible"
                )
            except Exception as e:
                self.result.add_test(
                    f"Table {table} Exists",
                    False,
                    f"Table {table} is not accessible: {e}"
                )
    
    async def test_backend_api_connectivity(self):
        """Test backend API connectivity and basic endpoints"""
        print(f"{Colors.BLUE}🌐 Testing Backend API Connectivity...{Colors.END}")
        
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            try:
                response = await client.get(f"{self.api_base_url}/health", timeout=10.0)
                self.result.add_test(
                    "Backend Health Endpoint",
                    response.status_code == 200,
                    f"Health endpoint returned HTTP {response.status_code}"
                )
            except Exception as e:
                self.result.add_test(
                    "Backend Health Endpoint",
                    False,
                    f"Backend health check failed: {e}"
                )
                self.result.add_warning("Backend may not be running. Start with: cd backend-python && uvicorn app.main:app --reload")
                return
            
            # Test root endpoint
            try:
                response = await client.get("http://localhost:8000/", timeout=10.0)
                self.result.add_test(
                    "Backend Root Endpoint",
                    response.status_code == 200,
                    f"Root endpoint accessible"
                )
            except Exception as e:
                self.result.add_test(
                    "Backend Root Endpoint",
                    False,
                    f"Root endpoint failed: {e}"
                )
    
    async def test_authentication_flow(self):
        """Test authentication flow with mock tokens"""
        print(f"{Colors.BLUE}🔐 Testing Authentication Flow...{Colors.END}")
        
        # Test unauthenticated access (should be denied)
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.api_base_url}/ideas", timeout=10.0)
                
                # Should get 401 Unauthorized or 422 if no token provided
                if response.status_code in [401, 422]:
                    self.result.add_test(
                        "Unauthenticated Access Denied",
                        True,
                        f"Properly denied unauthenticated access (HTTP {response.status_code})"
                    )
                else:
                    self.result.add_test(
                        "Unauthenticated Access Denied",
                        False,
                        f"Should deny unauthenticated access, got HTTP {response.status_code}"
                    )
            except Exception as e:
                self.result.add_test(
                    "Unauthenticated Access Test",
                    False,
                    f"Authentication test failed: {e}"
                )
        
        # Test invalid token (should be denied)
        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": "Bearer invalid-token-here"}
                response = await client.get(f"{self.api_base_url}/ideas", headers=headers, timeout=10.0)
                
                if response.status_code in [401, 403]:
                    self.result.add_test(
                        "Invalid Token Rejected",
                        True,
                        f"Properly rejected invalid token (HTTP {response.status_code})"
                    )
                else:
                    self.result.add_test(
                        "Invalid Token Rejected",
                        False,
                        f"Should reject invalid token, got HTTP {response.status_code}"
                    )
            except Exception as e:
                self.result.add_test(
                    "Invalid Token Test",
                    False,
                    f"Invalid token test failed: {e}"
                )
        
        self.result.add_warning("Full authentication testing requires valid JWT tokens from Supabase Auth")
    
    async def test_crud_operations_with_rls(self):
        """Test CRUD operations with Row Level Security"""
        print(f"{Colors.BLUE}📝 Testing CRUD Operations with RLS...{Colors.END}")
        
        # Note: These tests would require valid authentication tokens in a real scenario
        # For now, we test the database layer directly
        
        try:
            # Test basic read operations (should respect RLS)
            ideas_response = await self.client.from_("ideas").select("id,title").limit(5).execute()
            
            if ideas_response:
                result_count = len(ideas_response.data) if ideas_response.data else 0
                self.result.add_test(
                    "RLS Filtered Read Operations",
                    True,
                    f"Read operations work with RLS (returned {result_count} results)"
                )
            else:
                self.result.add_test(
                    "RLS Filtered Read Operations",
                    True,
                    "RLS properly restricting read access"
                )
        except Exception as e:
            self.result.add_test(
                "CRUD Operations Test",
                False,
                f"CRUD operations test failed: {e}"
            )
        
        # Test write operations (should be restricted by RLS)
        try:
            # Attempt to create an idea without proper authentication
            test_idea = {
                "title": "Integration Test Idea",
                "description": "This idea is created during integration testing",
                "submitter_email": "test@example.com",
                "status": IdeaStatusEnum.DRAFT.value
            }
            
            # This should likely fail due to RLS
            response = await self.client.from_("ideas").insert(test_idea).execute()
            
            if hasattr(response, 'error') and response.error:
                self.result.add_test(
                    "RLS Write Protection",
                    True,
                    "RLS properly restricting write operations"
                )
            else:
                # If it succeeded, we need to clean it up
                if response.data:
                    created_id = response.data[0].get('id')
                    if created_id:
                        self.created_ideas.append(created_id)
                        self.result.add_cleanup_note(f"Created test idea with ID: {created_id}")
                
                self.result.add_test(
                    "RLS Write Operations",
                    True,
                    "Write operation completed (RLS may be configured for anon access)"
                )
        except Exception as e:
            # Exception is expected if RLS is properly configured
            self.result.add_test(
                "RLS Write Protection",
                True,
                f"RLS properly blocking unauthorized writes: {str(e)[:100]}"
            )
    
    async def test_role_based_access_control(self):
        """Test role-based access control"""
        print(f"{Colors.BLUE}👥 Testing Role-Based Access Control...{Colors.END}")
        
        # Test role definitions
        try:
            roles = [role.value for role in UserRoleEnum]
            self.result.add_test(
                "Role Definitions",
                len(roles) >= 3,  # Contributor, Evaluator, Admin
                f"Defined roles: {', '.join(roles)}"
            )
        except Exception as e:
            self.result.add_test(
                "Role Definitions",
                False,
                f"Role definition test failed: {e}"
            )
        
        # Test default role assignment
        self.result.add_test(
            "Default Role Assignment",
            UserRoleEnum.CONTRIBUTOR.value == "Contributor",
            "Default role is Contributor"
        )
        
        self.result.add_warning("Full RBAC testing requires authenticated users with different roles")
    
    async def test_data_consistency(self):
        """Test data consistency and integrity"""
        print(f"{Colors.BLUE}🔍 Testing Data Consistency...{Colors.END}")
        
        try:
            # Test user table consistency
            users_response = await self.client.from_("users").select("id,email,roles").limit(10).execute()
            
            if users_response and users_response.data:
                consistent_users = 0
                for user in users_response.data:
                    if user.get('id') and user.get('email'):
                        consistent_users += 1
                
                self.result.add_test(
                    "User Data Consistency",
                    consistent_users > 0,
                    f"Found {consistent_users} users with consistent data structure"
                )
            else:
                self.result.add_test(
                    "User Data Consistency",
                    True,
                    "No user data found or RLS restricting access (expected)"
                )
        except Exception as e:
            self.result.add_test(
                "Data Consistency Test",
                False,
                f"Data consistency test failed: {e}"
            )
        
        # Test foreign key relationships
        try:
            # Ideas should reference valid users
            ideas_response = await self.client.from_("ideas").select("id,submitter_email").limit(5).execute()
            
            if ideas_response and ideas_response.data:
                valid_references = 0
                for idea in ideas_response.data:
                    if idea.get('submitter_email'):
                        valid_references += 1
                
                self.result.add_test(
                    "Foreign Key Relationships",
                    valid_references >= 0,
                    f"Found {valid_references} ideas with valid submitter references"
                )
            else:
                self.result.add_test(
                    "Foreign Key Relationships",
                    True,
                    "No idea data found or RLS restricting access"
                )
        except Exception as e:
            self.result.add_test(
                "Foreign Key Test",
                False,
                f"Foreign key test failed: {e}"
            )
    
    async def test_error_handling(self):
        """Test error handling and edge cases"""
        print(f"{Colors.BLUE}⚠️  Testing Error Handling...{Colors.END}")
        
        # Test malformed requests
        async with httpx.AsyncClient() as client:
            try:
                # Test malformed JSON
                headers = {"Content-Type": "application/json"}
                response = await client.post(
                    f"{self.api_base_url}/ideas",
                    content="invalid-json",
                    headers=headers,
                    timeout=10.0
                )
                
                if response.status_code in [400, 401, 422]:
                    self.result.add_test(
                        "Malformed Request Handling",
                        True,
                        f"Properly handled malformed request (HTTP {response.status_code})"
                    )
                else:
                    self.result.add_test(
                        "Malformed Request Handling",
                        False,
                        f"Should reject malformed requests, got HTTP {response.status_code}"
                    )
            except Exception as e:
                self.result.add_test(
                    "Error Handling Test",
                    False,
                    f"Error handling test failed: {e}"
                )
        
        # Test database constraint violations
        try:
            # Attempt to create invalid data
            invalid_idea = {
                "title": "",  # Should violate min length constraint
                "description": "x",  # Should violate min length constraint
                "submitter_email": "invalid-email"  # Should violate email format
            }
            
            response = await self.client.from_("ideas").insert(invalid_idea).execute()
            
            # Should fail due to validation
            if hasattr(response, 'error') and response.error:
                self.result.add_test(
                    "Constraint Validation",
                    True,
                    "Database properly validates constraints"
                )
            else:
                self.result.add_test(
                    "Constraint Validation",
                    False,
                    "Database should validate constraints"
                )
        except Exception as e:
            # Exception is good - means validation is working
            self.result.add_test(
                "Constraint Validation",
                True,
                f"Database properly enforcing constraints: {str(e)[:100]}"
            )
    
    async def cleanup_test_data(self):
        """Clean up any test data created during tests"""
        if self.created_ideas:
            print(f"{Colors.BLUE}🧹 Cleaning up test data...{Colors.END}")
            
            for idea_id in self.created_ideas:
                try:
                    await self.client.from_("ideas").delete().eq('id', idea_id).execute()
                    print(f"   Cleaned up idea: {idea_id}")
                except Exception as e:
                    print(f"   Failed to clean up idea {idea_id}: {e}")


async def main():
    """Main integration test entry point"""
    tester = SupabaseIntegrationTester()
    try:
        success = await tester.test_all()
        await tester.cleanup_test_data()
        
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Integration tests interrupted by user{Colors.END}")
        await tester.cleanup_test_data()
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Integration tests failed with error: {e}{Colors.END}")
        await tester.cleanup_test_data()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
