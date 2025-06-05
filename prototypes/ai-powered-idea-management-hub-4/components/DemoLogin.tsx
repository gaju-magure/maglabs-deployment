/**
 * Demo Login Component
 * 
 * Provides a quick login interface for demo mode with predefined demo users.
 * Only visible when VITE_DEMO_MODE is enabled.
 */

import React from 'react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../lib/supabase';

interface DemoLoginProps {
  className?: string;
}

export const DemoLogin: React.FC<DemoLoginProps> = ({ className = '' }) => {
  const { isDemoMode, quickDemoLogin, demoUsers, login, isLoading } = useAuth();

  // Don't render if not in demo mode
  if (!isDemoMode) {
    return null;
  }

  const handleQuickLogin = async (role: UserRole) => {
    if (quickDemoLogin) {
      await quickDemoLogin(role);
    }
  };

  const handleEmailLogin = async (email: string) => {
    await login(email, 'demo');
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-blue-800">Demo Mode</h3>
      </div>
      
      <p className="text-sm text-blue-600 mb-4">
        Quick demo access - no password required!
      </p>

      {/* Quick Role Login */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Quick Login by Role:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickLogin(UserRole.CONTRIBUTOR)}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            👤 Contributor
          </button>
          <button
            onClick={() => handleQuickLogin(UserRole.EVALUATOR)}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            📝 Evaluator
          </button>
          <button
            onClick={() => handleQuickLogin(UserRole.ADMIN)}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            ⚡ Admin
          </button>
        </div>
      </div>

      {/* Detailed Demo Users */}
      {demoUsers && demoUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Or login as specific demo user:</h4>
          <div className="space-y-2">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleEmailLogin(user.email)}
                disabled={isLoading}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="flex gap-1 mt-1">
                      {user.roles.map((role) => (
                        <span 
                          key={role}
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            role === 'Admin' 
                              ? 'bg-amber-100 text-amber-800'
                              : role === 'Evaluator'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          💡 <strong>Tip:</strong> You can also use the regular login form with any demo email above and any password.
        </p>
      </div>
    </div>
  );
};