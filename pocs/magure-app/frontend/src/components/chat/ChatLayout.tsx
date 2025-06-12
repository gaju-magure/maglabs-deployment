import React from 'react';
import { ChatSessionSidebar } from './ChatSessionSidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      <ChatSessionSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};