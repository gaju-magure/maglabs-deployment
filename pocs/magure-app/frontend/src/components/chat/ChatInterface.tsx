import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, RefreshCw, Lightbulb, MoreVertical, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatMessage } from './ChatMessage';
import { SubmitIdeaDialog } from './SubmitIdeaDialog';
import { ChatHelpModal } from './ChatHelpModal';
import { toast } from '@/hooks/use-toast';
import {
  sendMessage,
  regenerateResponse,
  updateSessionTitle,
  startInterview,
  type ChatSessionDetail,
  type SendMessageRequest,
} from '@/services/chatApi';

interface ChatInterfaceProps {
  session: ChatSessionDetail;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => sendMessage(session.id, data),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session.id], response.session_updated);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setMessage('');
      scrollToBottom();
    },
    onError: (error: any) => {
      let errorMessage = "Failed to send message. Please try again.";
      
      // Enhanced error handling with specific messages
      if (error?.response?.status === 503) {
        errorMessage = "AI service is temporarily unavailable. Please check your connection and try again.";
      } else if (error?.response?.status === 502) {
        errorMessage = "Received invalid response from AI service. Please try rephrasing your message.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error occurred. Our team has been notified. Please try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const regenerateMutation = useMutation({
    mutationFn: () => regenerateResponse(session.id),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session.id], response.session_updated);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate response.",
        variant: "destructive",
      });
    },
  });
  
  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => updateSessionTitle(session.id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatSession', session.id] });
    },
  });
  
  const startInterviewMutation = useMutation({
    mutationFn: (message?: string) => startInterview(session.id, message),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session.id], response.session_updated);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast({
        title: "Interview Started",
        description: "AI interview mode activated for comprehensive idea development.",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to start interview mode.";
      
      // Enhanced error handling for interview mode
      if (error?.response?.status === 503) {
        errorMessage = "AI service is unavailable. Please ensure the MagLabs VLLM API is running and try again.";
      } else if (error?.response?.status === 502) {
        errorMessage = "AI service returned an invalid response. Please try again.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error occurred while starting interview. Please try again later.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Interview Mode Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);
  
  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      content: message.trim(),
      message_type: 'text',
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleEditTitle = () => {
    const newTitle = prompt('Enter new title:', session.title);
    if (newTitle && newTitle !== session.title) {
      updateTitleMutation.mutate(newTitle);
    }
  };
  
  const handleStartInterview = () => {
    const interviewMessage = "I have a business idea I want to develop comprehensively";
    startInterviewMutation.mutate(interviewMessage);
  };
  
  const isProcessing = sendMessageMutation.isPending || regenerateMutation.isPending || startInterviewMutation.isPending;
  const isInInterviewMode = session.ai_metadata?.interview_mode;
  
  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{session.title}</h2>
              {isInInterviewMode && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                  Interview Mode
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {session.message_count} messages
              {session.total_tokens_used > 0 && ` • ${session.total_tokens_used} tokens`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelpModal(true)}
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <HelpCircle size={16} />
              Help
            </Button>
            {session.can_submit_idea && !session.is_idea_submitted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitDialog(true)}
                className="gap-2"
              >
                <Lightbulb size={16} />
                Submit as Idea
              </Button>
            )}
            {!isInInterviewMode && session.message_count === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartInterview}
                disabled={startInterviewMutation.isPending}
                className="gap-2"
              >
                <Sparkles size={16} />
                Start Interview
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowHelpModal(true)}>
                  <HelpCircle size={16} className="mr-2" />
                  Help & Guide
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditTitle}>
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => regenerateMutation.mutate()}
                  disabled={session.messages.length === 0}
                >
                  Regenerate Last Response
                </DropdownMenuItem>
                {!isInInterviewMode && (
                  <DropdownMenuItem onClick={handleStartInterview}>
                    Start Interview Mode
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1 px-6">
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {session.messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-500 mb-2">
                  Ask me anything about your ideas, and I'll help you refine and develop them.
                </p>
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline mb-4"
                >
                  Need help getting started? Click here for tips and examples
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("I have an idea for improving our workflow")}
                  >
                    Improve workflow
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("How can we enhance customer experience?")}
                  >
                    Customer experience
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("I want to solve a technical problem")}
                  >
                    Technical solution
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartInterview}
                    disabled={startInterviewMutation.isPending}
                  >
                    <Sparkles size={14} className="mr-1" />
                    Interview mode
                  </Button>
                </div>
              </div>
            ) : (
              session.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="animate-spin" size={16} />
                <span>
                  {startInterviewMutation.isPending 
                    ? 'Starting interview mode...' 
                    : 'AI is thinking...'
                  }
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[80px] pr-12 resize-none"
                disabled={isProcessing}
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2"
                onClick={handleSend}
                disabled={!message.trim() || isProcessing}
              >
                <Send size={16} />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Press Enter to send, Shift+Enter for new line
              </p>
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Need help?
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Idea Dialog */}
      {showSubmitDialog && (
        <SubmitIdeaDialog
          session={session}
          onClose={() => setShowSubmitDialog(false)}
          onSuccess={() => {
            setShowSubmitDialog(false);
            queryClient.invalidateQueries({ queryKey: ['chatSession', session.id] });
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
            toast({
              title: "Success",
              description: "Your idea has been submitted successfully!",
            });
          }}
        />
      )}
      
      {/* Help Modal */}
      <ChatHelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </>
  );
};

import { MessageSquare } from 'lucide-react';