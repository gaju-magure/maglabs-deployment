# Tenant Onboarding UI Guide

## Tenant Table with Onboarding Status

### Column Layout
```
| Tenant Info | Domain | Onboarding | Status | Created | Updated | Actions |
|-------------|--------|------------|---------|----------|---------|---------|
```

### Onboarding Status Column Examples

#### 1. Pending Tenant
```
┌─────────────────────────────┐
│ ⚠️  Pending                 │
│                             │
└─────────────────────────────┘
```

#### 2. In Progress Tenant  
```
┌─────────────────────────────┐
│ 🕒 In Progress     2/4      │
│ ████████░░░░░░  50%         │
└─────────────────────────────┘
```

#### 3. Completed Tenant
```
┌─────────────────────────────┐
│ ✅ Complete                 │
│                             │
└─────────────────────────────┘
```

### Action Buttons

#### For Pending Tenants
```
┌──────────────────┐  ┌────────┐  ┌────────┐
│ ✉️  Send Invitation │  │ ✏️ Edit │  │ 🗑️ Delete │
└──────────────────┘  └────────┘  └────────┘
```

#### For In Progress Tenants
```
┌─────────────────────┐  ┌────────┐  ┌────────┐
│ 🔄 Resend Invitation │  │ ✏️ Edit │  │ 🗑️ Delete │
└─────────────────────┘  └────────┘  └────────┘
```

#### For Completed Tenants
```
┌─────────────────────┐  ┌────────┐  ┌────────┐
│ ✅ Completed (disabled) │  │ ✏️ Edit │  │ 🗑️ Delete │
└─────────────────────┘  └────────┘  └────────┘
```

## User Flow Examples

### Example 1: New Tenant Creation
1. **SuperAdmin creates tenant**
   - Status: `Pending`
   - Action: "Send Invitation" button available

2. **SuperAdmin clicks "Send Invitation"**
   - Email sent to tenant admin
   - Status changes to: `In Progress`
   - Button changes to: "Resend Invitation"
   - Progress bar shows: 25% (1/4 steps)

3. **Tenant admin completes onboarding**
   - Status changes to: `Completed`
   - Button becomes disabled: "Completed"
   - Progress bar shows: 100% (4/4 steps)

### Example 2: Resend Scenario
1. **Tenant admin doesn't respond to initial email**
   - Status: `In Progress` 
   - Button: "Resend Invitation"

2. **SuperAdmin clicks "Resend Invitation"**
   - New token generated (old one invalidated)
   - Fresh email sent
   - Progress preserved (still shows previous steps completed)
   - Toast: "Onboarding invitation resent to admin@company.com"

### Example 3: Email Failure Handling
1. **SuperAdmin clicks "Send Invitation"**
2. **Email service fails**
   - Toast shows: "Invitation prepared but email delivery failed"
   - Manual token provided for sharing
   - Status still updates to track attempt

## Toast Notifications

### Success Messages
- ✅ "Onboarding invitation sent to admin@company.com"
- ✅ "Onboarding invitation resent to admin@company.com"

### Error Messages  
- ❌ "Invitation prepared but email delivery failed. Manual token: abc-123-def"
- ❌ "Failed to send invitation: Network error"
- ❌ "Tenant onboarding is already completed"

## Technical Implementation

### Button State Logic
```typescript
const getInvitationAction = (tenant) => {
  switch (tenant.onboarding_status) {
    case 'pending':
      return {
        label: 'Send Invitation',
        icon: <Mail />,
        disabled: false,
        className: 'text-blue-600 hover:text-blue-700'
      };
    case 'in_progress':
      return {
        label: 'Resend Invitation', 
        icon: <RefreshCw />,
        disabled: false,
        className: 'text-blue-600 hover:text-blue-700'
      };
    case 'completed':
      return {
        label: 'Completed',
        icon: <Mail className="opacity-50" />,
        disabled: true,
        className: 'text-gray-400 cursor-not-allowed'
      };
  }
};
```

### API Call Flow
```typescript
const handleSendInvitation = async (tenant) => {
  try {
    const result = await sendOnboardingInvitation(tenant.id);
    
    const actionText = result.is_resend ? 'resent' : 'sent';
    
    toast({
      title: "Success",
      description: `Onboarding invitation ${actionText} to ${result.admin_email}`
    });
    
    // Refresh table data
    fetchTenants(true);
  } catch (error) {
    toast({
      title: "Error", 
      description: error.message,
      variant: "destructive"
    });
  }
};
```

## Security Features

### Token Management
- **48-hour expiration**: All tokens expire automatically
- **One-time use**: Tokens invalidated after onboarding completion
- **Fresh generation**: Each resend creates new token
- **Secure URLs**: HTTPS-only links in production

### Permission Checks
- **SuperAdmin only**: Only SuperAdmins can send invitations
- **Tenant validation**: System verifies tenant exists and is accessible
- **Status validation**: Prevents sending to completed tenants

## Troubleshooting Guide

### "Send Invitation" Button Not Showing
1. Check user role (must be SuperAdmin)
2. Verify tenant status (should be pending/in_progress)
3. Check browser console for JavaScript errors
4. Verify API connectivity

### Email Not Being Sent
1. Check Django email configuration
2. Verify SMTP credentials
3. Check email logs/console output
4. Test with console backend first

### Token Expired Issues
1. Tokens expire after 48 hours
2. Use "Resend Invitation" to generate fresh token
3. Check server timezone settings
4. Verify token generation logic

### Progress Not Updating
1. Check backend API responses
2. Verify frontend refresh logic
3. Check onboarding step completion
4. Test with browser dev tools