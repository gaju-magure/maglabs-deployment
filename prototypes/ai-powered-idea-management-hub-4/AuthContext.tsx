import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { authHelpers, UserProfile, UserRole } from './lib/supabase';
import { mockAuth, MockUser, DEMO_USERS } from './lib/mockAuth';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organisationId: string | null;
  role: UserRole;
  fullName?: string | null;
  authUserId: string;
  isActive: boolean;
  department?: string | null;
  title?: string | null;
}

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  supabaseUser: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  // Demo mode specific methods
  quickDemoLogin?: (role?: UserRole) => Promise<boolean>;
  demoUsers?: MockUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if demo mode is enabled
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || 
                     (window as any).ENV?.VITE_DEMO_MODE === 'true';

  // Convert UserProfile to AuthenticatedUser format
  const createAuthenticatedUser = (profile: UserProfile): AuthenticatedUser => {
    return {
      id: profile.id,
      email: profile.email,
      organisationId: profile.organisation_id,
      role: (profile.roles?.[0] as UserRole) || UserRole.CONTRIBUTOR,
      fullName: profile.full_name,
      authUserId: profile.auth_user_id || '',
      isActive: profile.is_active,
      department: profile.department,
      title: profile.title
    };
  };

  // Convert MockUser to AuthenticatedUser format  
  const createAuthenticatedUserFromMock = (mockUser: MockUser): AuthenticatedUser => {
    return {
      id: mockUser.id,
      email: mockUser.email,
      organisationId: null, // Demo users don't have organizations
      role: mockUser.roles[0] as UserRole, // Use first role
      fullName: mockUser.full_name,
      authUserId: mockUser.id, // Use same ID for demo
      isActive: true,
      department: null,
      title: null
    };
  };

  // Initialize auth state and listen for changes
  useEffect(() => {
    console.log(`🔄 Initializing auth state... (Demo mode: ${isDemoMode})`);
    
    if (isDemoMode) {
      // Demo mode: use mock authentication
      const unsubscribe = mockAuth.onAuthStateChange((mockUser) => {
        if (mockUser) {
          setCurrentUser(createAuthenticatedUserFromMock(mockUser));
          setError(null);
          console.log('✅ Demo user authenticated:', mockUser.email, mockUser.roles);
        } else {
          setCurrentUser(null);
          setError(null);
          console.log('✅ Demo user signed out');
        }
        setIsLoading(false);
      });

      return unsubscribe;
    } else {
      // Production mode: use Supabase authentication
      const { data: { subscription } } = authHelpers.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.email);
          
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              setSupabaseUser(session.user);
              
              // Fetch user profile from our custom users table
              const profile = await authHelpers.getCurrentUserProfile();
              if (profile && profile.is_active) {
                setUserProfile(profile);
                setCurrentUser(createAuthenticatedUser(profile));
                setError(null);
                console.log('✅ User authenticated:', profile.email, profile.roles);
              } else {
                console.warn('⚠️ User profile not found or inactive');
                setError('User profile not found or account is inactive');
                await authHelpers.signOut();
              }
            } else if (event === 'SIGNED_OUT') {
              setSupabaseUser(null);
              setUserProfile(null);
              setCurrentUser(null);
              setError(null);
              console.log('✅ User signed out');
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('🔄 Token refreshed for:', session.user.email);
            }
          } catch (err) {
            console.error('❌ Auth state change error:', err);
            setError('Authentication error occurred');
            setSupabaseUser(null);
            setUserProfile(null);
            setCurrentUser(null);
          } finally {
            setIsLoading(false);
          }
        }
      );

      // Check current session on mount
      authHelpers.getCurrentUser().then(async (user) => {
        if (user) {
          setSupabaseUser(user);
          const profile = await authHelpers.getCurrentUserProfile();
          if (profile && profile.is_active) {
            setUserProfile(profile);
            setCurrentUser(createAuthenticatedUser(profile));
          }
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isDemoMode]);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log(`🔐 Login attempt for: ${email} (Demo mode: ${isDemoMode})`);
    setIsLoading(true);
    setError(null);
    
    try {
      if (isDemoMode) {
        // Demo mode login
        const { user, error: signInError } = await mockAuth.signIn(email, password);
        
        if (signInError || !user) {
          console.error('❌ Demo login failed:', signInError);
          setError(signInError || 'Demo login failed');
          return false;
        }

        // The mock auth state change listener will handle setting the user
        return true;
      } else {
        // Production mode login
        const { user, error: signInError } = await authHelpers.signIn(email, password);
        
        if (signInError || !user) {
          console.error('❌ Login failed:', signInError?.message);
          setError(signInError?.message || 'Login failed');
          return false;
        }

        // The auth state change listener will handle setting the user profile
        return true;
      }
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('An unexpected error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log(`🚪 Logout initiated (Demo mode: ${isDemoMode})`);
    setIsLoading(true);
    
    try {
      if (isDemoMode) {
        await mockAuth.signOut();
        // The mock auth state change listener will handle clearing the state
      } else {
        await authHelpers.signOut();
        // The auth state change listener will handle clearing the state
      }
    } catch (err) {
      console.error('❌ Logout error:', err);
      setError('Error during logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick demo login function (only available in demo mode)
  const quickDemoLogin = async (role: UserRole = UserRole.CONTRIBUTOR): Promise<boolean> => {
    if (!isDemoMode) {
      console.warn('quickDemoLogin only available in demo mode');
      return false;
    }

    console.log(`🎭 Quick demo login for role: ${role}`);
    setIsLoading(true);
    setError(null);

    try {
      const { user, error: signInError } = await mockAuth.quickDemoLogin(role);
      
      if (signInError || !user) {
        console.error('❌ Quick demo login failed:', signInError);
        setError(signInError || 'Quick demo login failed');
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Quick demo login error:', err);
      setError('An unexpected error occurred during demo login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    supabaseUser,
    userProfile,
    login,
    logout,
    isLoading,
    error,
    isDemoMode,
    quickDemoLogin: isDemoMode ? quickDemoLogin : undefined,
    demoUsers: isDemoMode ? DEMO_USERS : undefined
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};