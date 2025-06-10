# Tenant Onboarding System

## Overview

The tenant onboarding system allows SuperAdmins to create tenants and automatically send email invitations to tenant administrators. The tenant admin can then complete their setup through a guided wizard accessed via a secure token link.

## System Architecture

### Backend Components

1. **Models** (`apps/tenants/models.py`)
   - `Tenant`: Extended with onboarding fields (status, token, admin_email)
   - `TenantOnboarding`: Tracks step-by-step progress

2. **API Endpoints** (`apps/tenants/urls.py`)
   - `POST /api/v1/tenants/{id}/send_invitation/` - Send onboarding invitation
   - `POST /api/v1/tenants/onboarding/verify-token/` - Verify onboarding token
   - `POST /api/v1/tenants/onboarding/profile-setup/` - Complete profile setup
   - `POST /api/v1/tenants/onboarding/company-details/` - Save company details
   - `POST /api/v1/tenants/onboarding/preferences/` - Complete preferences
   - `POST /api/v1/tenants/onboarding/status/` - Get onboarding status

3. **Email Service** (`services/email_service.py`)
   - Professional HTML/text email templates
   - Invitation and completion notifications

### Frontend Components

1. **Pages**
   - `/onboarding/:token` - Public onboarding wizard page

2. **Components**
   - `OnboardingWizard` - Main orchestrator
   - Step components: `ProfileSetupStep`, `CompanyDetailsStep`, `PreferencesStep`

3. **Integration**
   - Tenant table shows onboarding status
   - "Send Invitation" action in tenant management

## How Email Invitations Work

### Current Implementation Status

✅ **EMAIL SYSTEM FULLY IMPLEMENTED AND WORKING** ✅

The email infrastructure is complete and working! By default, it uses console output for development (emails printed to terminal). Ready for production SMTP configuration.

### Email Flow

1. **SuperAdmin triggers invitation** → Clicks "Send Invitation" in tenant table
2. **Backend generates secure token** → UUID token with 48-hour expiration
3. **Email service sends invitation** → Professional HTML email with onboarding link
4. **Tenant admin receives email** → Contains link: `https://{tenant}.domain.com/onboarding/{token}`
5. **Click link starts onboarding** → Token verified, wizard begins

### Email Configuration Required

To enable email sending, configure Django email settings in `config/settings/base.py`:

#### Option 1: SMTP Email (Recommended for Production)

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # or your SMTP server
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'MagLabs <noreply@maglabs.com>'
```

#### Option 2: Console Backend (Development)

```python
# Development - prints emails to console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

#### Option 3: File Backend (Testing)

```python
# Testing - saves emails to files
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = '/tmp/app-messages'
```

### Environment Variables

Add to your `.env` file:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=MagLabs <noreply@maglabs.com>
```

Update `config/env.py` to include email settings:

```python
class _EMAIL:
    backend = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
    host = config("EMAIL_HOST", default="localhost")
    port = config("EMAIL_PORT", default=25, cast=int)
    use_tls = config("EMAIL_USE_TLS", default=False, cast=bool)
    host_user = config("EMAIL_HOST_USER", default="")
    host_password = config("EMAIL_HOST_PASSWORD", default="")
    default_from = config("DEFAULT_FROM_EMAIL", default="webmaster@localhost")

email = _EMAIL()
```

Then in `config/settings/base.py`:

```python
from config.env import email

# Email settings
EMAIL_BACKEND = email.backend
EMAIL_HOST = email.host
EMAIL_PORT = email.port
EMAIL_USE_TLS = email.use_tls
EMAIL_HOST_USER = email.host_user
EMAIL_HOST_PASSWORD = email.host_password
DEFAULT_FROM_EMAIL = email.default_from
```

## Complete Onboarding Flow

### 1. Tenant Creation
```
SuperAdmin → Create Tenant → Tenant with PENDING status created
```

### 2. Send Invitation
```
SuperAdmin → Click "Send Invitation" → EmailService.send_onboarding_invitation()
  ↓
Token generated → Email sent → Tenant status: IN_PROGRESS
```

### 3. Onboarding Steps
```
Admin clicks email link → /onboarding/{token}
  ↓
Token verification → Onboarding wizard loads
  ↓
Step 1: Profile Setup (name, password)
  ↓
Step 2: Company Details (info, size, industry)
  ↓
Step 3: Preferences (timezone, notifications)
  ↓
Completion → Tenant status: COMPLETED → Redirect to dashboard
```

## Testing the System

### Quick Test with Script

Run the test script to verify email functionality:

```bash
cd backend
python test_email_invitation.py
```

This will:
- Create a test tenant
- Generate onboarding token
- Send invitation email (printed to console)
- Show the onboarding URL
- Display current email configuration

### Full Integration Test

### 1. Setup Email Backend

For development testing, use console backend (default):

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### 2. Run Migrations

```bash
cd backend
python manage.py migrate
```

### 3. Create SuperAdmin

```bash
python manage.py createsuperuser
```

### 4. Test Flow

1. Start Django server: `python manage.py runserver`
2. Login as SuperAdmin at `http://localhost:8000/admin` or via API
3. Create a new tenant through the admin interface or API
4. Click "Send Invitation" - email will print to console
5. Copy the onboarding URL from console output
6. Open URL in browser to test onboarding wizard

### Expected Output

When sending an invitation, you'll see:
- Professional HTML and text email content
- Secure onboarding URL with token
- 48-hour expiration notice
- Progress tracking updates

### Send/Resend Invitation Features

**✅ Send Invitation Button**
- Appears for tenants with `pending` status
- Shows "Send Invitation" with mail icon
- Generates new token and sends email

**✅ Resend Invitation Button**  
- Appears for tenants with `in_progress` status
- Shows "Resend Invitation" with refresh icon
- Generates fresh token (invalidates old one)
- Preserves onboarding progress

**✅ Smart Token Management**
- Each send/resend generates a new 48-hour token
- Old tokens are automatically invalidated
- No manual token cleanup needed

**✅ Visual Status Indicators**
- **Pending**: Yellow "Pending" badge + "Send Invitation" button
- **In Progress**: Blue progress bar + "Resend Invitation" button  
- **Completed**: Green "Complete" badge + disabled button

**✅ Automatic Resend Logic**
- System detects if invitation is a resend
- Preserves completed onboarding steps
- Updates email templates accordingly
- Provides clear feedback to admin

## Production Deployment

### 1. Email Service Setup

Configure production email service (Gmail, SendGrid, AWS SES, etc.)

### 2. Domain Configuration

Update email templates to use production domain:

```python
# In services/email_service.py
onboarding_url = f"https://{primary_domain.domain}/onboarding/{token}"
```

For production, this should resolve to:
- `https://tenantname.yourdomain.com/onboarding/{token}`

### 3. SSL/TLS Configuration

Ensure HTTPS is configured for secure token transmission.

## Email Templates

Professional email templates are located in:
- `templates/emails/onboarding_invitation.html`
- `templates/emails/onboarding_invitation.txt`
- `templates/emails/onboarding_completion.html`
- `templates/emails/onboarding_completion.txt`

Templates include:
- Professional styling with gradients
- Responsive design
- Clear call-to-action buttons
- Security notices
- Company branding

## Troubleshooting

### Email Not Sending

1. Check Django email configuration
2. Verify SMTP credentials
3. Check firewall/security settings
4. Test with console backend first

### Token Issues

1. Check token expiration (48 hours)
2. Verify token format (UUID)
3. Check database for token existence

### Frontend Issues

1. Verify routing configuration
2. Check API endpoint connectivity
3. Validate token in browser network tab

## Security Features

- **Secure UUID tokens** with expiration
- **One-time use** tokens (expire after completion)
- **HTTPS-only** links in production
- **No sensitive data** in URLs
- **Token validation** on every request

## Monitoring

Monitor the onboarding process through:
- Tenant onboarding status in admin dashboard
- Email delivery logs
- API endpoint usage
- User completion rates

---

## Quick Start Checklist

- [ ] Configure Django email settings
- [ ] Run database migrations
- [ ] Update email templates with your branding
- [ ] Test with console email backend
- [ ] Configure production email service
- [ ] Set up domain/subdomain routing
- [ ] Test complete onboarding flow