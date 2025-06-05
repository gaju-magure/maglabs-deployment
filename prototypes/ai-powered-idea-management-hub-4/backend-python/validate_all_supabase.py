#!/usr/bin/env python3
"""
Master Supabase Validation Script

This script runs all Supabase validation tests in sequence and provides
a comprehensive report of the entire authentication system status.
"""

import asyncio
import os
import sys
import subprocess
import time
from typing import List, Tuple, Dict

# Add the app directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))


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


class MasterValidationResult:
    """Container for master validation results"""
    
    def __init__(self):
        self.validator_results: List[Tuple[str, bool, str, float]] = []
        self.total_start_time = time.time()
        
    def add_validator_result(self, name: str, passed: bool, details: str, duration: float):
        """Add a validator result"""
        self.validator_results.append((name, passed, details, duration))
        
    def print_final_report(self):
        """Print the final comprehensive report"""
        total_duration = time.time() - self.total_start_time
        passed_validators = sum(1 for _, passed, _, _ in self.validator_results if passed)
        total_validators = len(self.validator_results)
        
        print(f"\n{Colors.BOLD}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}🎯 MASTER SUPABASE VALIDATION REPORT{Colors.END}")
        print(f"{Colors.BOLD}{'='*80}{Colors.END}")
        
        print(f"\n{Colors.BLUE}📊 VALIDATION SUMMARY:{Colors.END}")
        
        for name, passed, details, duration in self.validator_results:
            status_color = Colors.GREEN if passed else Colors.RED
            status_symbol = "✅" if passed else "❌"
            print(f"{status_symbol} {status_color}{name:<30}{Colors.END} {Colors.CYAN}({duration:.2f}s){Colors.END}")
            if details:
                print(f"   {Colors.WHITE}{details}{Colors.END}")
        
        print(f"\n{Colors.BOLD}📈 OVERALL STATISTICS:{Colors.END}")
        print(f"   Total Duration: {Colors.CYAN}{total_duration:.2f}s{Colors.END}")
        print(f"   Validators Passed: {Colors.GREEN}{passed_validators}{Colors.END}")
        print(f"   Validators Failed: {Colors.RED}{total_validators - passed_validators}{Colors.END}")
        print(f"   Success Rate: {Colors.CYAN}{(passed_validators/total_validators*100):.1f}%{Colors.END}")
        
        if passed_validators == total_validators:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL VALIDATIONS PASSED!{Colors.END}")
            print(f"{Colors.GREEN}Your Supabase authentication system is fully validated and ready for production.{Colors.END}")
            
            print(f"\n{Colors.BLUE}✨ NEXT STEPS:{Colors.END}")
            print(f"   {Colors.BLUE}• Test with real user signup/login flows{Colors.END}")
            print(f"   {Colors.BLUE}• Configure production environment variables{Colors.END}")
            print(f"   {Colors.BLUE}• Set up monitoring and logging{Colors.END}")
            print(f"   {Colors.BLUE}• Review and update RLS policies as needed{Colors.END}")
            
            return True
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ VALIDATION FAILURES DETECTED{Colors.END}")
            print(f"{Colors.RED}Please review and fix the failed validations above before proceeding to production.{Colors.END}")
            
            print(f"\n{Colors.YELLOW}🔧 TROUBLESHOOTING TIPS:{Colors.END}")
            print(f"   {Colors.YELLOW}• Check your .env file for missing/incorrect values{Colors.END}")
            print(f"   {Colors.YELLOW}• Verify Supabase project settings and API keys{Colors.END}")
            print(f"   {Colors.YELLOW}• Ensure database migrations have been applied{Colors.END}")
            print(f"   {Colors.YELLOW}• Check network connectivity to Supabase{Colors.END}")
            
            return False


class MasterValidator:
    """Master validator that orchestrates all validation scripts"""
    
    def __init__(self):
        self.result = MasterValidationResult()
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        
    async def run_all_validations(self, include_integration: bool = False) -> bool:
        """Run all validation scripts in order"""
        
        print(f"{Colors.BOLD}🚀 Starting Master Supabase Validation Suite...{Colors.END}")
        print(f"{Colors.CYAN}This will run all validation scripts in sequence to provide a comprehensive assessment.{Colors.END}\n")
        
        # Define validation scripts in order of execution
        validators = [
            ("Quick Health Check", "supabase_health_check.py", "Fast connectivity and basic checks"),
            ("Configuration Validation", "validate_supabase_config.py", "Environment variables, connectivity, JWT setup"),
            ("Database Schema Validation", "validate_db_schema.py", "Table structure, triggers, functions, RLS"),
            ("Authentication Flow Validation", "validate_auth_flow.py", "JWT validation, user creation, role management"),
        ]
        
        # Add integration tests if requested
        if include_integration:
            validators.append(
                ("Integration Testing", "test_supabase_integration.py", "End-to-end system testing")
            )
        
        # Run each validator
        for name, script, description in validators:
            print(f"{Colors.BLUE}🔄 Running {name}...{Colors.END}")
            print(f"   {Colors.CYAN}{description}{Colors.END}")
            
            success, details, duration = await self.run_validator(script)
            self.result.add_validator_result(name, success, details, duration)
            
            # Short pause between validators
            await asyncio.sleep(0.5)
        
        return self.result.print_final_report()
    
    async def run_validator(self, script_name: str) -> Tuple[bool, str, float]:
        """Run a single validator script"""
        script_path = os.path.join(self.script_dir, script_name)
        
        if not os.path.exists(script_path):
            return False, f"Script not found: {script_path}", 0.0
        
        start_time = time.time()
        
        try:
            # Run the validator script
            process = await asyncio.create_subprocess_exec(
                sys.executable, script_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            duration = time.time() - start_time
            
            # Check exit code
            if process.returncode == 0:
                return True, "All tests passed", duration
            else:
                error_msg = stderr.decode('utf-8').strip() if stderr else "Unknown error"
                return False, f"Validation failed: {error_msg[:100]}", duration
                
        except Exception as e:
            duration = time.time() - start_time
            return False, f"Execution error: {str(e)[:100]}", duration
    
    def check_prerequisites(self) -> bool:
        """Check that all required scripts exist"""
        required_scripts = [
            "supabase_health_check.py",
            "validate_supabase_config.py", 
            "validate_db_schema.py",
            "validate_auth_flow.py",
            "test_supabase_integration.py"
        ]
        
        missing_scripts = []
        for script in required_scripts:
            script_path = os.path.join(self.script_dir, script)
            if not os.path.exists(script_path):
                missing_scripts.append(script)
        
        if missing_scripts:
            print(f"{Colors.RED}❌ Missing validation scripts:{Colors.END}")
            for script in missing_scripts:
                print(f"   {Colors.RED}• {script}{Colors.END}")
            return False
        
        print(f"{Colors.GREEN}✅ All validation scripts found{Colors.END}")
        return True


def print_usage():
    """Print usage information"""
    print(f"{Colors.BOLD}Supabase Master Validation Suite{Colors.END}")
    print(f"{Colors.CYAN}Comprehensive validation of your Supabase authentication system{Colors.END}\n")
    
    print(f"{Colors.BOLD}Usage:{Colors.END}")
    print(f"  python validate_all_supabase.py [options]")
    
    print(f"\n{Colors.BOLD}Options:{Colors.END}")
    print(f"  --help, -h          Show this help message")
    print(f"  --integration, -i   Include integration tests (requires running backend)")
    print(f"  --quick, -q         Run only quick health check")
    
    print(f"\n{Colors.BOLD}Examples:{Colors.END}")
    print(f"  python validate_all_supabase.py                    # Run all validations except integration")
    print(f"  python validate_all_supabase.py --integration      # Run all validations including integration")
    print(f"  python validate_all_supabase.py --quick            # Quick health check only")
    
    print(f"\n{Colors.BOLD}What gets validated:{Colors.END}")
    print(f"  {Colors.GREEN}✓{Colors.END} Environment variables and configuration")
    print(f"  {Colors.GREEN}✓{Colors.END} Supabase API connectivity")
    print(f"  {Colors.GREEN}✓{Colors.END} JWT infrastructure and JWKS endpoints")
    print(f"  {Colors.GREEN}✓{Colors.END} Database schema and table structure")
    print(f"  {Colors.GREEN}✓{Colors.END} Database triggers and functions")
    print(f"  {Colors.GREEN}✓{Colors.END} Row Level Security (RLS) policies")
    print(f"  {Colors.GREEN}✓{Colors.END} Authentication flow and token validation")
    print(f"  {Colors.GREEN}✓{Colors.END} Role-based access control (RBAC)")
    print(f"  {Colors.GREEN}✓{Colors.END} End-to-end integration (with --integration)")


async def main():
    """Main entry point"""
    
    # Parse command line arguments
    include_integration = "--integration" in sys.argv or "-i" in sys.argv
    quick_only = "--quick" in sys.argv or "-q" in sys.argv
    show_help = "--help" in sys.argv or "-h" in sys.argv
    
    if show_help:
        print_usage()
        return
    
    validator = MasterValidator()
    
    # Check prerequisites
    if not validator.check_prerequisites():
        print(f"\n{Colors.RED}Cannot proceed without all validation scripts{Colors.END}")
        sys.exit(1)
    
    try:
        if quick_only:
            # Run only health check
            print(f"{Colors.BLUE}🏃‍♂️ Running quick health check only...{Colors.END}\n")
            success, details, duration = await validator.run_validator("supabase_health_check.py")
            
            if success:
                print(f"\n{Colors.GREEN}✅ Quick health check passed ({duration:.2f}s){Colors.END}")
                print(f"{Colors.GREEN}Run full validation with: python validate_all_supabase.py{Colors.END}")
            else:
                print(f"\n{Colors.RED}❌ Quick health check failed: {details}{Colors.END}")
                sys.exit(1)
        else:
            # Run full validation suite
            success = await validator.run_all_validations(include_integration)
            
            if not success:
                sys.exit(1)
                
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Validation interrupted by user{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Validation failed with error: {e}{Colors.END}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
