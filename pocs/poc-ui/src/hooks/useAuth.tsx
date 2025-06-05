
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'executive' | 'admin';
  tenantId: string;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'employee',
    tenantId: 'tenant-1'
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user based on email
    let mockUser: User;
    if (email.includes('executive')) {
      mockUser = {
        id: '2',
        name: 'Jane Executive',
        email: email,
        role: 'executive',
        tenantId: 'tenant-1'
      };
    } else if (email.includes('admin')) {
      mockUser = {
        id: '3',
        name: 'Admin User',
        email: email,
        role: 'admin',
        tenantId: 'tenant-1'
      };
    } else {
      mockUser = {
        id: '1',
        name: 'John Employee',
        email: email,
        role: 'employee',
        tenantId: 'tenant-1'
      };
    }
    
    setUser(mockUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
