# Supabase Configuration Validation Scripts

This directory contains a comprehensive suite of validation scripts to verify that your Supabase authentication system is properly configured and working correctly. These scripts are essential for ensuring your backend authentication flow is production-ready.

## 📋 Overview

The validation suite consists of 5 main scripts plus a master orchestrator:

| Script | Purpose | Duration | Dependencies |
|--------|---------|----------|--------------|
| `supabase_health_check.py` | Quick connectivity check | ~5s | Basic |
| `validate_supabase_config.py` | Environment & connectivity validation | ~10s | Basic |
| `validate_db_schema.py` | Database schema & structure validation | ~15s | Database |
| `validate_auth_flow.py` | Authentication flow validation | ~20s | Auth Setup |
| `test_supabase_integration.py` | End-to-end integration testing | ~30s | Running Backend |
| `validate_all_supabase.py` | **Master script - runs all validations** | ~1min | All Above |

## 🚀 Quick Start

### 1. Run Master Validation (Recommended)

```bash
# Run all validations (recommended first step)
python validate_all_supabase.py

# Include integration tests (requires running backend)
python validate_all_supabase.py --integration

# Quick health check only
python validate_all_supabase.py --quick

# Show help
python validate_all_supabase.py --help
```

### 2. Individual Script Usage

```bash
# Quick health check (fastest)
python supabase_health_check.py

# Full configuration validation
python validate_supabase_config.py

# Database schema validation
python validate_db_schema.py

# Authentication flow validation
python validate_auth_flow.py

# Integration testing (requires backend running)
python test_supabase_integration.py
```

## 📊 What Gets Validated

### ✅ Environment & Configuration
- All required environment variables present
- Supabase URL format validation
- API key presence and format
- CORS configuration check

### ✅ Connectivity & Infrastructure  
- Supabase API accessibility
- REST API endpoint availability
- JWKS endpoint connectivity
- Authentication endpoints

### ✅ JWT & Authentication
- JWKS key structure validation
- JWT secret configuration
- Token validation mechanics
- Invalid/expired token handling
- Malformed token rejection

### ✅ Database Schema
- Required tables exist (`users`, `ideas`)
- Column structure validation
- Constraint verification
- Index recommendations

### ✅ Database Functions & Triggers
- User sync trigger (`handle_new_user_sync`)
- Updated timestamp trigger (`handle_users_updated_at`)
- Admin check function (`is_user_admin`)

### ✅ Row Level Security (RLS)
- RLS enabled on critical tables
- Policy enforcement testing
- Access restriction validation
- Cross-user data isolation

### ✅ Role-Based Access Control (RBAC)
- Role definitions (`Contributor`, `Evaluator`, `Admin`)
- Default role assignment
- RBAC dependency functions
- Permission boundary testing

### ✅ Integration & End-to-End
- Backend API connectivity
- Authentication flow testing
- CRUD operations with RLS
- Data consistency validation
- Error handling verification

## 🔧 Prerequisites

### Required Environment Variables

Create a `.env` file in the `backend-python` directory with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Optional: CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://yourdomain.com"]

# Other required variables...
GEMINI_API_KEY=your-gemini-key-here
```

### Required Python Packages

```bash
# Install required packages
pip install httpx jwt pydantic pydantic-settings supabase
```

### Database Setup

Ensure your Supabase database has been set up with the required migrations:

```bash
# Apply migrations (if using Supabase CLI)
supabase db push

# Or apply the migration files manually in Supabase Dashboard
```

## 📈 Understanding Results

### ✅ Success Indicators
- **Green checkmarks**: All tests passed
- **Detailed feedback**: Specific information about what was validated
- **Performance metrics**: Execution time for each validation

### ❌ Failure Indicators  
- **Red X marks**: Failed validations
- **Error details**: Specific information about what failed
- **Recommendations**: Actionable steps to fix issues

### ⚠️ Warnings & Notes
- **Yellow warnings**: Non-critical issues that should be addressed
- **Blue recommendations**: Best practices and optimization suggestions
- **Purple security notes**: Security considerations and manual tests needed

## 🔍 Troubleshooting Common Issues

### Environment Variable Issues
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
python -c "from app.core.config import settings; print(settings.SUPABASE_URL)"
```

### Connectivity Issues
```bash
# Test basic connectivity
curl https://your-project-id.supabase.co

# Test JWKS endpoint
curl https://your-project-id.supabase.co/auth/v1/.well-known/jwks.json
```

### Database Issues
- **Table not found**: Apply database migrations
- **RLS errors**: Check policies in Supabase Dashboard > Authentication > Policies
- **Permission denied**: Verify API keys have correct permissions

### Authentication Issues
- **JWT validation fails**: Check JWT secret matches your Supabase project
- **Invalid audience/issuer**: Verify URL configuration
- **JWKS errors**: Check network connectivity to Supabase

## 🛡️ Security Considerations

### Production Checklist
- [ ] All validation scripts pass
- [ ] CORS origins configured for production domains only
- [ ] JWT secrets are secure and rotated regularly
- [ ] RLS policies properly restrict data access
- [ ] Admin roles are assigned only to authorized users
- [ ] HTTPS is enforced for all connections

### Manual Testing Required
- [ ] Test user signup/login flow with real users
- [ ] Verify RLS with different user roles
- [ ] Test role escalation prevention
- [ ] Validate admin-only endpoints with different roles
- [ ] Test token expiration and refresh

## 📚 Advanced Usage

### Running in CI/CD

```yaml
# Example GitHub Actions step
- name: Validate Supabase Configuration
  run: |
    cd backend-python
    python validate_all_supabase.py
```

### Custom Validation

You can extend the validation scripts by:

1. Adding new test cases to existing scripts
2. Creating custom validators following the established patterns
3. Adding new scripts to the master validator

### Integration with Monitoring

```python
# Example: Add monitoring integration
from validate_all_supabase import MasterValidator

async def scheduled_validation():
    validator = MasterValidator()
    success = await validator.run_all_validations()
    
    # Send results to monitoring system
    if not success:
        send_alert("Supabase validation failed")
```

## 🆘 Getting Help

### Common Commands
```bash
# Show detailed help for master script
python validate_all_supabase.py --help

# Run verbose validation with detailed output
python validate_supabase_config.py 2>&1 | tee validation.log

# Check specific component
python supabase_health_check.py
```

### Log Analysis
All scripts provide detailed output that can be redirected to files for analysis:

```bash
# Capture full validation log
python validate_all_supabase.py > validation_report.txt 2>&1
```

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [JWT.io](https://jwt.io) for JWT debugging
- [Supabase Dashboard](https://app.supabase.com) for project management

---

## 🎯 Success Criteria

Your Supabase authentication system is ready for production when:

1. ✅ **All validation scripts pass** without errors
2. ✅ **Integration tests complete** successfully  
3. ✅ **Manual user flows work** (signup, login, logout)
4. ✅ **RLS policies properly restrict** data access
5. ✅ **Role-based access control** functions correctly
6. ✅ **Security best practices** are implemented

**Remember**: These scripts validate the technical implementation. Always test with real user scenarios before going to production!
