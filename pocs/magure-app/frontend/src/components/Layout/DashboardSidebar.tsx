
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Settings, Users, FileText, Lightbulb, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardSidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getSidebarItems = () => {
    switch (user?.role) {
      case 'superadmin':
        return [
          { title: 'Tenants', url: '/dashboard/tenants', icon: Building },
          { title: 'Customize Onboarding', url: '/dashboard/onboarding', icon: Palette },
          { title: 'Site Settings', url: '/dashboard/settings', icon: Settings },
        ];
      case 'tenant_admin':
        return [
          { title: 'Content Wall', url: '/tenant/content', icon: FileText },
          { title: 'User Management', url: '/tenant/users', icon: Users },
          { title: 'Idea Submission', url: '/tenant/ideas', icon: Lightbulb },
        ];
      case 'tenant_user':
        return [
          { title: 'Idea Submission', url: '/tenant/ideas', icon: Lightbulb },
        ];
      default:
        return [];
    }
  };

  const items = getSidebarItems();

  return (
    <Sidebar className="border-r bg-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        location.pathname === item.url
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
