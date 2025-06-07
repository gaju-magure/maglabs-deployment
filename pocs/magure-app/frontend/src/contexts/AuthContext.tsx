
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/utils/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'tenant_admin' | 'tenant_user';
  tenantSchema?: string;
  tenantName?: string;
  tenantDomain?: string;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to decode JWT and extract user info

const decodeJWT = (token: string): User | null => {
  try {
    debugger;
    // 1) Split the JWT and base64‐decode the payload
    const base64Payload = token.split('.')[1];
    const payload: Record<string, any> = JSON.parse(atob(base64Payload));

    // 2) Build our User object directly from the claims:
    return {
      id:            payload.user_id?.toString()       || payload.sub?.toString() || '',
      email:         payload.email                     || '',
      firstName:     payload.first_name                || '',
      lastName:      payload.last_name                 || '',
      role:          payload.role                      || 'tenant_user',
      tenantSchema:  payload.tenant_schema             || undefined,
      tenantName:    payload.tenant_name               || undefined,
      tenantDomain:  payload.tenant_domain             || undefined,
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('auth_token');
    if (token) {
      const userData = decodeJWT(token);
      setUser(userData);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login({
        username: email,
        password: password,
      });

      localStorage.setItem('auth_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      debugger;
      const userData = decodeJWT(response.access);
      setUser(userData);
    } catch (error) {
      throw new Error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
