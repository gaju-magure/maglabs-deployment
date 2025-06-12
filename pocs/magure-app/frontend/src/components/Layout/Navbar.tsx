
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, X, User, Settings } from 'lucide-react';
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
            <span className="text-sm text-gray-600 truncate max-w-32" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {user?.firstName} {user?.lastName}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    {user?.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                    )}
                    <AvatarFallback className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {user?.role === UserRole.TenantAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center cursor-pointer" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Avatar and Menu */}
          <div className="flex sm:hidden items-center gap-2">
            <Avatar className="h-8 w-8">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
              )}
              <AvatarFallback className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white text-xs">
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
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-3 mt-3">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 hover:text-blue-700 font-medium py-2 px-3 rounded-md hover:bg-gray-50 flex items-center"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </Link>
              {user?.role === UserRole.TenantAdmin && (
                <Link
                  to="/dashboard/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-blue-700 font-medium py-2 px-3 rounded-md hover:bg-gray-50 flex items-center"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Settings
                </Link>
              )}
            </div>
            <div className="border-t pt-3 mt-3 sm:hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
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
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
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
