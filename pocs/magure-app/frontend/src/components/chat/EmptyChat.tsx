import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, Plus, Sparkles, Lightbulb, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createChatSession } from '@/services/chatApi';

interface EmptyChatProps {
  onNewChat: (sessionId: string) => void;
}

export const EmptyChat: React.FC<EmptyChatProps> = ({ onNewChat }) => {
  const createSessionMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (newSession) => {
      onNewChat(newSession.id);
    },
  });
  
  const handleCreateChat = (type: string, title: string) => {
    createSessionMutation.mutate({
      title,
      conversation_type: type as any,
    });
  };
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl mx-auto text-center px-4">
        <div className="mb-8">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to AI Chat
          </h1>
          <p className="text-lg text-gray-600">
            Start a conversation to brainstorm, refine, and develop your ideas with AI assistance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Brainstorming</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Generate new ideas and explore creative solutions with AI guidance.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCreateChat('brainstorm', 'Brainstorming Session')}
              disabled={createSessionMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Brainstorming
            </Button>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Idea Refinement</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Polish and improve existing ideas with structured feedback and suggestions.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCreateChat('refine', 'Idea Refinement')}
              disabled={createSessionMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refine Ideas
            </Button>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Problem Solving</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Work through challenges and find solutions with AI-powered analysis.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCreateChat('problem_solving', 'Problem Solving')}
              disabled={createSessionMutation.isPending}
            >
              <Settings className="w-4 h-4 mr-2" />
              Solve Problems
            </Button>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">General Chat</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Open conversation for any topic or question you want to explore.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCreateChat('general', 'General Chat')}
              disabled={createSessionMutation.isPending}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Tip</h4>
          <p className="text-sm text-blue-800">
            Use interview mode for comprehensive idea development with guided questions and expert analysis.
          </p>
        </div>
      </div>
    </div>
  );
};