
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  Grid, 
  Plus, 
  TrendingUp, 
  Calendar,
  Award,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: string;
}

export const Sidebar = ({ userRole }: SidebarProps) => {
  const getNavigationItems = () => {
    switch (userRole) {
      case 'employee':
        return [
          { icon: Grid, label: 'Dashboard', path: '/dashboard' },
          { icon: Plus, label: 'Submit Idea', path: '/submit-idea' },
          { icon: Lightbulb, label: 'My Ideas', path: '/my-ideas' },
          { icon: TrendingUp, label: 'Content Wall', path: '/content-wall' },
          { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
        ];
      case 'executive':
        return [
          { icon: Grid, label: 'Dashboard', path: '/dashboard' },
          { icon: TrendingUp, label: 'High-Scoring Ideas', path: '/high-scoring-ideas' },
          { icon: Calendar, label: 'Review Queue', path: '/review-queue' },
          { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        ];
      case 'admin':
        return [
          { icon: Grid, label: 'Dashboard', path: '/dashboard' },
          { icon: Users, label: 'User Management', path: '/user-management' },
          { icon: Settings, label: 'Tenant Settings', path: '/tenant-settings' },
          { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            IdeaForge
          </span>
        </div>
      </div>

      <nav className="px-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
