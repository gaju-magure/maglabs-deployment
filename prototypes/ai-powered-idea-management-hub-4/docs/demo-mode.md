# Demo Mode Configuration

This document explains how to configure and use the demo mode for the AI-Powered Idea Management Hub, which allows for smooth demonstrations without requiring real Supabase authentication.

## Overview

Demo mode provides:
- **Mock Authentication**: No real user accounts or network calls required
- **Predefined Demo Users**: Different roles (Contributor, Evaluator, Admin) for testing
- **Quick Login Options**: One-click login for different user types
- **Seamless Switching**: Easy toggle between demo and production modes

## Configuration

### Enabling Demo Mode

1. **Using Environment Variable**:
   ```bash
   # In .env.local
   VITE_DEMO_MODE=true
   ```

2. **Using Demo Template**:
   ```bash
   # Copy the demo environment template
   cp .env.demo .env.local
   ```

3. **Runtime Configuration**:
   Demo mode can also be set via window.ENV for Docker deployments:
   ```javascript
   window.ENV = { VITE_DEMO_MODE: 'true' }
   ```

### Disabling Demo Mode

```bash
# In .env.local
VITE_DEMO_MODE=false
# or simply remove the line
```

## Demo Users

The system provides several predefined demo users:

### Quick Role Login
- **👤 Contributor**: Basic user who can submit ideas
- **📝 Evaluator**: Can review and evaluate ideas
- **⚡ Admin**: Full system access and management

### Detailed Demo Users
1. **Demo Contributor** (`contributor@demo.com`)
   - Role: Contributor
   - Access: Submit and manage own ideas

2. **Demo Evaluator** (`evaluator@demo.com`)
   - Role: Evaluator
   - Access: Review and evaluate submitted ideas

3. **Demo Admin** (`admin@demo.com`)
   - Role: Admin
   - Access: Full system administration

4. **Demo Manager** (`manager@demo.com`)
   - Roles: Contributor + Evaluator
   - Access: Submit ideas and evaluate others

## Usage

### For Demos and Presentations

1. **Enable Demo Mode**:
   ```bash
   VITE_DEMO_MODE=true
   ```

2. **Start the Application**:
   ```bash
   npm run dev
   ```

3. **Quick Login**:
   - Use the quick role buttons for instant access
   - Or click specific demo user cards
   - No password required!

### For Development and Testing

1. **Test Different Roles**:
   ```javascript
   // In browser console
   useAuth().quickDemoLogin('Admin')
   ```

2. **Switch Users Quickly**:
   - Logout and select different demo user
   - Test role-based access control
   - Verify UI changes per role

### For Production

1. **Disable Demo Mode**:
   ```bash
   VITE_DEMO_MODE=false
   ```

2. **Use Real Supabase Configuration**:
   ```bash
   VITE_SUPABASE_URL=your-real-supabase-url
   VITE_SUPABASE_ANON_KEY=your-real-anon-key
   ```

## UI Changes in Demo Mode

When demo mode is enabled:

- **Login Page**: Shows demo user selection interface
- **Wider Layout**: Accommodates demo controls
- **Quick Login Buttons**: Role-based one-click login
- **User Cards**: Visual demo user selection
- **Divider Section**: Separates demo and manual login options

When demo mode is disabled:
- **Standard Login**: Email/password form only
- **Test Credentials**: Shows production test accounts
- **Compact Layout**: Standard login page design

## Technical Implementation

### Core Components

1. **MockAuthProvider** (`lib/mockAuth.ts`):
   - Simulates Supabase authentication
   - Manages demo user sessions
   - Provides state persistence

2. **AuthContext Updates** (`AuthContext.tsx`):
   - Detects demo mode configuration
   - Routes to appropriate auth provider
   - Maintains compatible interface

3. **DemoLogin Component** (`components/DemoLogin.tsx`):
   - Demo user selection interface
   - Quick role-based login
   - Only renders in demo mode

### Authentication Flow

```
┌─── Demo Mode Enabled ───┐
│                         │
│  ┌─── User Login ───┐   │
│  │                  │   │
│  │  Quick Role      │   │
│  │  Demo User       │   │
│  │  Email/Pass      │   │
│  │                  │   │
│  └─────────────────┘   │
│           │             │
│  ┌─── MockAuth ───┐    │
│  │                │    │
│  │  Local Storage │    │
│  │  State Mgmt    │    │
│  │  Session Sim   │    │
│  │                │    │
│  └────────────────┘    │
└─────────────────────────┘

┌─── Demo Mode Disabled ──┐
│                          │
│  ┌─── User Login ───┐    │
│  │                  │    │
│  │  Email/Password  │    │
│  │                  │    │
│  └──────────────────┘    │
│           │               │
│  ┌─── Supabase ────┐     │
│  │                 │     │
│  │  Real Auth      │     │
│  │  Database       │     │
│  │  RLS Policies   │     │
│  │                 │     │
│  └─────────────────┘     │
└───────────────────────────┘
```

## Best Practices

### For Demonstrations
- ✅ Use quick role login for speed
- ✅ Prepare different scenarios per role
- ✅ Test key workflows beforehand
- ✅ Have fallback to manual login if needed

### For Development
- ✅ Use specific demo users for consistent testing
- ✅ Test role transitions and permissions
- ✅ Verify localStorage persistence
- ✅ Test both demo and production modes

### For Production
- ✅ Always disable demo mode
- ✅ Use real Supabase configuration
- ✅ Test authentication thoroughly
- ✅ Monitor for demo mode artifacts

## Security Notes

- Demo mode is **frontend-only** and doesn't bypass backend security
- Real API calls still require proper authentication
- Demo users exist only in browser localStorage
- Production deployment should always disable demo mode

## Troubleshooting

### Demo Mode Not Working
1. Check environment variable: `VITE_DEMO_MODE=true`
2. Restart development server
3. Clear browser localStorage
4. Verify no TypeScript errors

### Login Issues
1. Check browser console for errors
2. Verify demo users are loaded
3. Clear localStorage: `localStorage.clear()`
4. Refresh page and try again

### Missing Demo Users
1. Verify import paths in components
2. Check UserRole enum usage
3. Ensure DEMO_USERS array is populated
4. Check for console errors during initialization

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_DEMO_MODE` | `true`/`false` | Enables/disables demo mode |
| `VITE_SUPABASE_URL` | URL string | Supabase project URL (can be dummy in demo) |
| `VITE_SUPABASE_ANON_KEY` | Key string | Supabase anonymous key (can be dummy in demo) |