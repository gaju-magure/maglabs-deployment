
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserRole } from '@/enums/userRole';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getDisplayName = () => {
    if (user?.role === 'superadmin') {
      return 'Dashboard Admin';
    }
    return user?.tenantName || 'Dashboard';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user?.email[0].toUpperCase() || 'U';
  };

  // Role-based navigation links
  const getNavLinks = () => {
    switch (user?.role) {
      case UserRole.SuperAdmin:
        return [
          { to: '/dashboard/users', label: 'User Management' },
          { to: '/dashboard/tenants', label: 'Tenants' },
          { to: '/dashboard/onboarding', label: 'Onboarding' },
          { to: '/dashboard/settings', label: 'Settings' },
        ];
      case UserRole.TenantAdmin:
        return [
          { to: '/dashboard/content', label: 'Content Wall' },
          { to: '/dashboard/users', label: 'User Management' },
          { to: '/dashboard/organization', label: 'Organization' },
          { to: '/dashboard/ideas', label: 'Idea Submission' },
        ];
      case UserRole.TenantUser:
        return [
          { to: '/dashboard/ideas', label: 'Idea Submission' },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="border-b bg-white px-4 sm:px-6 py-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {getDisplayName()}
          </h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 ml-6">
            {getNavLinks().map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-blue-700 font-medium whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop User Info */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-sm text-gray-600 truncate max-w-32">
              {user?.firstName} {user?.lastName}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 hidden lg:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 lg:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Avatar and Menu */}
          <div className="flex sm:hidden items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Menu Button for larger screens */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden hidden sm:flex text-gray-600 hover:text-gray-900"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50 md:hidden">
          <nav className="flex flex-col p-4 space-y-3">
            {getNavLinks().map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 hover:text-blue-700 font-medium py-2 px-3 rounded-md hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-3 mt-3 sm:hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
