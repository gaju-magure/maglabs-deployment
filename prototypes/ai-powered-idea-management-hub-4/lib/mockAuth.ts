/**
 * Mock Authentication Provider for Demo Mode
 * 
 * This module provides a mock authentication system that simulates
 * Supabase authentication behavior for demo purposes without requiring
 * real user accounts or network calls.
 */

import { UserRole } from './supabase';

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  avatar_url?: string;
  created_at: string;
}

export interface MockAuthState {
  user: MockUser | null;
  loading: boolean;
  error: string | null;
}

// Demo users for different roles
export const DEMO_USERS: MockUser[] = [
  {
    id: 'demo-contributor-1',
    email: 'contributor@demo.com',
    full_name: 'Demo Contributor',
    roles: [UserRole.CONTRIBUTOR],
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+Contributor&background=3b82f6&color=fff',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-evaluator-1',
    email: 'evaluator@demo.com',
    full_name: 'Demo Evaluator',
    roles: [UserRole.EVALUATOR],
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+Evaluator&background=10b981&color=fff',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-admin-1',
    email: 'admin@demo.com',
    full_name: 'Demo Admin',
    roles: [UserRole.ADMIN],
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+Admin&background=f59e0b&color=fff',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-multi-role-1',
    email: 'manager@demo.com',
    full_name: 'Demo Manager',
    roles: [UserRole.CONTRIBUTOR, UserRole.EVALUATOR],
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+Manager&background=8b5cf6&color=fff',
    created_at: new Date().toISOString(),
  },
];

export class MockAuthProvider {
  private currentUser: MockUser | null = null;
  private listeners: ((user: MockUser | null) => void)[] = [];

  constructor() {
    // Load persisted demo user from localStorage
    const savedUser = localStorage.getItem('demo_auth_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.warn('Failed to parse saved demo user:', error);
        localStorage.removeItem('demo_auth_user');
      }
    }
  }

  // Mock sign in - just select a demo user
  async signIn(email: string, _password: string = 'demo'): Promise<{ user: MockUser | null; error: string | null }> {
    // Simulate network delay
    await this.delay(500);

    const user = DEMO_USERS.find(u => u.email === email);
    if (!user) {
      return {
        user: null,
        error: 'Demo user not found. Available: contributor@demo.com, evaluator@demo.com, admin@demo.com, manager@demo.com'
      };
    }

    this.currentUser = user;
    this.persistUser(user);
    this.notifyListeners(user);

    return { user, error: null };
  }

  // Mock sign out
  async signOut(): Promise<{ error: string | null }> {
    await this.delay(200);
    
    this.currentUser = null;
    localStorage.removeItem('demo_auth_user');
    this.notifyListeners(null);

    return { error: null };
  }

  // Get current user
  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  // Mock user registration (just selects the first demo user)
  async signUp(email: string, _password: string = 'demo', userData?: Partial<MockUser>): Promise<{ user: MockUser | null; error: string | null }> {
    await this.delay(800);

    // For demo, just create a contributor user
    const user: MockUser = {
      id: `demo-${Date.now()}`,
      email,
      full_name: userData?.full_name || 'Demo User',
      roles: [UserRole.CONTRIBUTOR],
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.full_name || 'Demo User')}&background=6366f1&color=fff`,
      created_at: new Date().toISOString(),
    };

    this.currentUser = user;
    this.persistUser(user);
    this.notifyListeners(user);

    return { user, error: null };
  }

  // Quick demo login (bypass email/password)
  async quickDemoLogin(role: UserRole = UserRole.CONTRIBUTOR): Promise<{ user: MockUser | null; error: string | null }> {
    await this.delay(300);

    let user: MockUser;
    
    switch (role) {
      case UserRole.ADMIN:
        user = DEMO_USERS.find(u => u.roles.includes(UserRole.ADMIN))!;
        break;
      case UserRole.EVALUATOR:
        user = DEMO_USERS.find(u => u.roles.includes(UserRole.EVALUATOR) && !u.roles.includes(UserRole.CONTRIBUTOR))!;
        break;
      default:
        user = DEMO_USERS.find(u => u.roles.includes(UserRole.CONTRIBUTOR) && u.roles.length === 1)!;
    }

    this.currentUser = user;
    this.persistUser(user);
    this.notifyListeners(user);

    return { user, error: null };
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: MockUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Mock update user profile
  async updateUser(updates: Partial<MockUser>): Promise<{ user: MockUser | null; error: string | null }> {
    await this.delay(400);

    if (!this.currentUser) {
      return { user: null, error: 'No user logged in' };
    }

    const updatedUser = { ...this.currentUser, ...updates };
    this.currentUser = updatedUser;
    this.persistUser(updatedUser);
    this.notifyListeners(updatedUser);

    return { user: updatedUser, error: null };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private persistUser(user: MockUser): void {
    localStorage.setItem('demo_auth_user', JSON.stringify(user));
  }

  private notifyListeners(user: MockUser | null): void {
    this.listeners.forEach(callback => callback(user));
  }
}

// Singleton instance
export const mockAuth = new MockAuthProvider();