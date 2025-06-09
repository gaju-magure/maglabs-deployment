
import React, { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
        <div className="flex-1 flex flex-col h-full">
          <Navbar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
