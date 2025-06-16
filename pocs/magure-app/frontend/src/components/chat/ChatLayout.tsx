import React, { useState, useEffect } from 'react';
import { ChatSessionSidebar } from './ChatSessionSidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed for better mobile UX
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      // Auto-hide sidebar on mobile, auto-show on desktop
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      } else if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 w-full max-w-full min-w-0 relative">
      
      {/* Mobile overlay backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile 
          ? 'fixed inset-y-0 left-0 z-50 w-full max-w-sm' 
          : 'relative w-80 flex-shrink-0'
        }
        transition-transform duration-300 ease-in-out
      `}>
        <ChatSessionSidebar 
          onClose={isMobile ? () => setIsSidebarOpen(false) : undefined}
          isMobile={isMobile}
        />
      </div>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header with toggle button */}
        <div className="relative z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 hover:bg-gray-100 transition-colors mr-3"
            onClick={toggleSidebar}
          >
            <Menu size={18} className="text-gray-700" />
          </Button>
          <h1 className="text-sm font-medium text-gray-700">
            {isMobile ? 'Chat' : 'AI Assistant'}
          </h1>
        </div>
        
        <div className="flex-1 bg-white min-w-0 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};