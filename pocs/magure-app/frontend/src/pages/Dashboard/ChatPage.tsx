import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { getChatSession } from '@/services/chatApi';

export const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['chatSession', sessionId],
    queryFn: () => sessionId ? getChatSession(sessionId) : null,
    enabled: !!sessionId,
  });
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Chat Session Not Found</h1>
          <p className="text-gray-600 mb-4">The chat session you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={() => navigate('/dashboard/chat')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ChatLayout>
      {sessionId && session ? (
        <ChatInterface session={session} />
      ) : (
        <EmptyChat onNewChat={(id) => navigate(`/dashboard/chat/${id}`)} />
      )}
    </ChatLayout>
  );
};