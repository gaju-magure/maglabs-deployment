import { createClient } from '@supabase/supabase-js'

// Get environment variables from Vite first, fallback to window.ENV
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).ENV?.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).ENV?.VITE_SUPABASE_ANON_KEY

console.log('Supabase Configuration:', {
  url: supabaseUrl ? '✅ Loaded' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Loaded' : '❌ Missing',
  urlValue: supabaseUrl,
  keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Not found'
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!')
  console.error('Please ensure .env.local contains:')
  console.error('VITE_SUPABASE_URL=your-supabase-url')
  console.error('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key')
  console.error('Current values:', { 
    url: supabaseUrl || 'undefined',
    key: supabaseAnonKey ? 'present' : 'undefined'
  })
  // Don't throw error, use dummy values to allow app to load
}

// Use fallback values if environment variables are missing
const finalSupabaseUrl = supabaseUrl || 'https://dummy.supabase.co'
const finalSupabaseAnonKey = supabaseAnonKey || 'dummy-key'

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  auth_user_id: string | null
  email: string
  full_name: string | null
  roles: string[]
  department: string | null
  title: string | null
  contact_number: string | null
  organisation_id: string | null
  profile_picture_url: string | null
  is_active: boolean
  last_login_at: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

// User role enum matching the backend
export enum UserRole {
  CONTRIBUTOR = 'Contributor',
  EVALUATOR = 'Evaluator', 
  ADMIN = 'Admin'
}

// Auth helper functions
export const authHelpers = {
  async signIn(email: string, password: string) {
    console.log('🔐 Attempting login for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })
    
    if (error) {
      console.error('❌ Login error:', error)
      return { user: null, error }
    }
    
    console.log('✅ Login successful:', data.user?.email)
    return { user: data.user, error: null }
  },

  async signOut() {
    console.log('🚪 Logging out user')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('❌ Logout error:', error)
    } else {
      console.log('✅ Logout successful')
    }
    return { error }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('❌ Error getting current user:', error)
      return null
    }
    return user
  },

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser()
    if (!user) return null
    
    console.log('👤 Fetching profile for user:', user.id)
    
    // Try using the user ID directly first (auth.uid() = id)
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('❌ Error fetching user profile:', error.message)
      // Try fallback with auth_user_id if the primary key lookup failed
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
        
      if (fallbackError) {
        console.error('❌ Fallback profile fetch also failed:', fallbackError.message)
        return null
      }
      
      return fallbackProfile
    }
    
    if (profile) {
      console.log('✅ Profile loaded:', profile.email, profile.roles)
      // Update last login (only if we successfully got the profile)
      try {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch (updateError) {
        console.warn('⚠️ Could not update last login time:', updateError)
      }
    }
    
    return profile
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Listen for auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
