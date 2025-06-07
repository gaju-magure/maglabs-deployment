
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserRole } from '@/enums/userRole';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

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
          { to: '/tenant/content', label: 'Content Wall' },
          { to: '/tenant/users', label: 'User Management' },
          { to: '/tenant/ideas', label: 'Idea Submission' },
        ];
      case UserRole.TenantUser:
        return [
          { to: '/tenant/ideas', label: 'Idea Submission' },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {getDisplayName()}
          </h1>
          <nav className="flex gap-4 ml-6">
            {getNavLinks().map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-blue-700 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
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
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
