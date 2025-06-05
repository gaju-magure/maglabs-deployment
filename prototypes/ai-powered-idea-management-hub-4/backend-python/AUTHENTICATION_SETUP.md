# Supabase Authentication Setup

## 🔐 Authentication System Overview

The authentication system has been configured with the following features:

- **Email/Password authentication** (currently enabled)
- **Admin-only user registration** (self-registration disabled)
- **Automatic user profile creation** via database triggers
- **Role-based access control** (Contributor, Evaluator, Admin)
- **Row Level Security (RLS)** for data isolation
- **Auto-sync between Supabase Auth and custom user profiles**

## 📋 Database Schema

### Users Table Structure
```sql
users (
  id UUID PRIMARY KEY,                    -- Internal user ID
  auth_user_id UUID UNIQUE,              -- Links to auth.users.id
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  roles JSONB DEFAULT '["Contributor"]',  -- ["Contributor"], ["Evaluator"], ["Admin"]
  department TEXT,                        -- User's department
  title TEXT,                            -- Job title
  contact_number TEXT,                   -- Phone number
  organisation_id UUID,                  -- Multi-tenant support
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Automatic Triggers
- **`handle_new_user()`**: Creates user profile when someone signs up
- **`handle_user_update()`**: Syncs email changes and login times
- **Default role assignment**: New users automatically get "Contributor" role

## 🚀 Frontend Integration Recommendations

### Option 1: Supabase Auth UI (Recommended for MVP)
```typescript
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function LoginPage() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={[]} // No OAuth for now
      redirectTo={`${window.location.origin}/dashboard`}
      onlyThirdPartyProviders={false}
      magicLink={false} // Disabled for now
      showLinks={false} // Hide signup links (admin-only registration)
    />
  )
}
```

### Option 2: Custom Authentication Forms
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Login function
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Get current user profile
async function getCurrentUserProfile() {
  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser.user) return null
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.user.id)
    .single()
  
  return profile
}
```

## 🔑 Admin User Management

### Creating New Users (Admin Only)
```typescript
// Admin creates a new user account
async function createUser(email: string, password: string, role: string = 'Contributor') {
  // 1. Admin calls Supabase Admin API to create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email confirmation
  })
  
  if (authError) throw authError
  
  // 2. Update the user's role (trigger will have created profile with Contributor role)
  const { error: roleError } = await supabase
    .from('users')
    .update({ roles: [role] })
    .eq('auth_user_id', authUser.user.id)
  
  if (roleError) throw roleError
  
  return authUser.user
}
```

### Managing User Roles
```typescript
// Update user role (Admin only)
async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabase
    .from('users')
    .update({ roles: [newRole] })
    .eq('id', userId)
  
  return { error }
}

// Get all users (Admin/Evaluator only)
async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, roles, department, title, is_active, created_at')
    .order('created_at', { ascending: false })
  
  return { data, error }
}
```

## 🛡️ Row Level Security (RLS) Policies

The system enforces the following access controls:

### Users Table
- ✅ Users can view/update their own profile
- ✅ Admins can view/manage all users
- ✅ Users cannot change their own roles

### Ideas Table  
- ✅ Users can create and view their own ideas
- ✅ Evaluators/Admins can view all ideas
- ✅ Users can update their own draft ideas
- ✅ Evaluators/Admins can update any idea
- ✅ Only Admins can delete ideas

### Related Tables (Tags, Chat, Answers)
- ✅ Access inherits from parent idea permissions
- ✅ Users can manage data for ideas they have access to

## 📱 Frontend Authentication Context

### React Context Setup
```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile
          const profile = await getCurrentUserProfile()
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signIn: async (email, password) => {
        const { error } = await signIn(email, password)
        if (error) throw error
      },
      signOut: async () => {
        await supabase.auth.signOut()
      }
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## 🔒 Security Configuration

### Supabase Auth Settings
In your Supabase dashboard, configure:

1. **Authentication > Settings**:
   - ✅ Enable email/password
   - ❌ Disable self-registration (`"Enable signup"` = false)
   - ✅ Enable email confirmations (optional)
   - ❌ Disable magic links (for now)

2. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:5173` (development)
   - Redirect URLs: `http://localhost:5173/auth/callback`

3. **Database > Authentication**:
   - Ensure RLS is enabled on all tables
   - Test policies work correctly

## 🧪 Testing the Authentication

### Test Users Created
1. **Admin User**: `admin@example.com` (Admin role)
2. **Evaluator User**: `evaluator@example.com` (Evaluator role)  
3. **Contributor User**: `test@example.com` (Contributor role)

### Testing Checklist
- [ ] Admin can create new users
- [ ] Admin can manage user roles
- [ ] Users can sign in with email/password
- [ ] User profiles are auto-created via triggers
- [ ] RLS policies enforce proper access control
- [ ] Ideas are properly isolated by user permissions
- [ ] Chat and evaluation data respects user access

## 🚀 Next Steps

1. **Frontend Implementation**: Choose Auth UI vs Custom forms
2. **Admin Dashboard**: Build user management interface
3. **Role Management**: Implement role change workflows
4. **Password Reset**: Configure email templates
5. **Magic Links**: Enable for production (passwordless)
6. **2FA/MFA**: Add for enhanced security
7. **OAuth**: Add Google/GitHub for convenience

## 🔧 Environment Variables Required

```env
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env) - Already configured
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

The authentication system is now fully configured and ready for frontend integration! 🎉