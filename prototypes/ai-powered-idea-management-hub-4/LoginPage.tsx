import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LightBulbIcon, AlertTriangleIcon } from './components/icons';
import { DemoLogin } from './components/DemoLogin';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, isLoading, error: authError, isDemoMode } = useAuth();

  // Use auth error if available, otherwise use local error
  const displayError = authError || localError;

  // Clear local error when auth error changes
  useEffect(() => {
    if (authError) {
      setLocalError(null);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLocalError("Please enter both email and password.");
      return;
    }

    console.log('🔐 Login form submitted for:', trimmedEmail);
    
    const success = await login(trimmedEmail, trimmedPassword);
    if (!success && !authError) {
      setLocalError('Login failed. Please check your credentials and try again.');
    }
    // On success, App.tsx will detect currentUser change and navigate away
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
      <div className={`bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full ${isDemoMode ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="text-center mb-8">
          <LightBulbIcon className="w-16 h-16 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold uppercase text-neutral-darker">Idea Hub Login</h1>
          <p className="text-neutral-dark font-body-medium mt-1">Access your ideas and insights.</p>
        </div>

        {displayError && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center" role="alert">
            <AlertTriangleIcon className="w-5 h-5 mr-2 text-red-600" />
            <span className="block sm:inline">{displayError}</span>
          </div>
        )}

        {/* Demo Login Component (only shown in demo mode) */}
        {isDemoMode && (
          <div className="mb-6">
            <DemoLogin />
          </div>
        )}

        {/* Test credentials info (only shown in production mode) */}
        {!isDemoMode && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-semibold mb-2">Test Credentials:</p>
            <div className="text-xs space-y-1">
              <p><strong>Contributor:</strong> alice@example.com / TestPassword123!</p>
              <p><strong>Evaluator:</strong> bob@example.com / TestPassword123!</p>
            </div>
          </div>
        )}

        {/* Regular Login Form */}
        {isDemoMode && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or use email/password</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-darker mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-DEFAULT/70 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-darker mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-DEFAULT/70 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center py-3 px-6 border border-transparent btn-rounded shadow-sm text-base font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-all duration-150 disabled:opacity-70"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-xs text-neutral-DEFAULT">
          <p>For account access, please contact your system administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
