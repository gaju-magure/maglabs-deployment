import React, { useState, useEffect } from 'react';
import { ChatSessionSidebar } from './ChatSessionSidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      // Auto-hide sidebar on mobile
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 w-full max-w-full min-w-0">
      
      {/* Sidebar with conditional rendering */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} ${isMobile ? 'absolute inset-y-0 left-0 z-50' : 'relative'}`}>
        <ChatSessionSidebar onClose={isMobile ? () => setIsSidebarOpen(false) : undefined} />
      </div>
      
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Toggle button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 left-3 z-20 h-10 w-10 bg-white hover:bg-gray-100 shadow-md rounded-lg transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={18} className="text-gray-700" />
        </Button>
        
        <div className="flex-1 bg-white border-l border-gray-200 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
};