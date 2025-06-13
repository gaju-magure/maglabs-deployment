import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, RefreshCw, Lightbulb, MoreVertical, Sparkles, HelpCircle, ChevronRight, ChevronLeft, MessageSquare, BarChart3, AlertTriangle } from 'lucide-react';
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
import { StageProgressMeter } from './StageProgressMeter';
import { getLatestStageProgression, hasActiveStageProgression } from '@/utils/stageProgressUtils';
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
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Extract stage progression data from messages
  const stageData = getLatestStageProgression(session.messages);
  const hasStageProgression = hasActiveStageProgression(session.messages);
  
  // Stage definitions for progress bar
  const stageList = [
    { id: 'initialization', color: 'bg-gray-500' },
    { id: 'user_profiling', color: 'bg-blue-500' },
    { id: 'problem_capture', color: 'bg-purple-500' },
    { id: 'problem_clarification', color: 'bg-yellow-500' },
    { id: 'solution_brainstorming', color: 'bg-green-500' },
    { id: 'value_proposition', color: 'bg-indigo-500' },
    { id: 'report_generation', color: 'bg-orange-500' },
    { id: 'completed', color: 'bg-emerald-500' }
  ];
  
  const currentStageIndex = stageList.findIndex(stage => stage.id === (stageData.stage_name || 'initialization'));
  
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
      let isTokenLimitError = false;
      
      // Check for token limit errors in response
      if (error?.response?.status === 500) {
        const errorText = error?.response?.data?.detail || error?.message || '';
        if (errorText.includes('token') && (errorText.includes('limit') || errorText.includes('exceed'))) {
          isTokenLimitError = true;
          errorMessage = "Session token limit exceeded. The conversation has become too long. Please start a new session to continue.";
        } else {
          errorMessage = "Server error occurred. Our team has been notified. Please try again.";
        }
      } else if (error?.response?.status === 503) {
        errorMessage = "AI service is temporarily unavailable. Please check your connection and try again.";
      } else if (error?.response?.status === 502) {
        errorMessage = "Received invalid response from AI service. Please try rephrasing your message.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error occurred. Our team has been notified. Please try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: isTokenLimitError ? "Session Limit Reached" : "Error",
        description: errorMessage,
        variant: "destructive",
        action: isTokenLimitError ? (
          <button
            onClick={() => window.location.href = '/dashboard/ideas'}
            className="text-sm underline text-white hover:no-underline"
          >
            Start New Session
          </button>
        ) : undefined,
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
      let isTokenLimitError = false;
      
      // Enhanced error handling for interview mode
      if (error?.response?.status === 500) {
        const errorText = error?.response?.data?.detail || error?.message || '';
        if (errorText.includes('token') && (errorText.includes('limit') || errorText.includes('exceed'))) {
          isTokenLimitError = true;
          errorMessage = "Session token limit exceeded. Cannot start interview mode in this session. Please start a new session.";
        } else {
          errorMessage = "Server error occurred while starting interview. Please try again later.";
        }
      } else if (error?.response?.status === 503) {
        errorMessage = "AI service is unavailable. Please ensure the MagLabs VLLM API is running and try again.";
      } else if (error?.response?.status === 502) {
        errorMessage = "AI service returned an invalid response. Please try again.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error occurred while starting interview. Please try again later.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: isTokenLimitError ? "Session Limit Reached" : "Interview Mode Error",
        description: errorMessage,
        variant: "destructive",
        action: isTokenLimitError ? (
          <button
            onClick={() => window.location.href = '/dashboard/ideas'}
            className="text-sm underline text-white hover:no-underline"
          >
            Start New Session
          </button>
        ) : undefined,
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
    if (!message.trim() || sendMessageMutation.isPending || isTokenUsageHigh) return;
    
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
  const isTokenUsageHigh = session.total_tokens_used > 90000;
  const isTokenUsageWarning = session.total_tokens_used > 80000;
  
  return (
    <>
      <div className="flex h-full bg-white">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
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
              {session.total_tokens_used > 0 && (
                <span className={`ml-1 ${
                  session.total_tokens_used > 90000 ? 'text-red-600 font-medium' :
                  session.total_tokens_used > 80000 ? 'text-amber-600 font-medium' :
                  'text-gray-500'
                }`}>
                  • {session.total_tokens_used.toLocaleString()} tokens
                  {session.total_tokens_used > 90000 && ' (approaching limit)'}
                  {session.total_tokens_used > 80000 && session.total_tokens_used <= 90000 && ' (high usage)'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Always visible progress bar for all conversations */}
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                onClick={() => setShowProgressPanel(!showProgressPanel)}
                title="Click to view detailed progress"
              >
                <div className="flex items-center gap-1">
                  {/* Always show detailed interview-style progress */}
                  {stageList.map((stage, index) => (
                    <div 
                      key={stage.id}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index <= currentStageIndex ? stage.color : 'bg-gray-300'
                      } ${index === currentStageIndex ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                      title={`Stage ${index + 1}`}
                    />
                  ))}
                </div>
                <BarChart3 size={14} className="ml-1 text-gray-600" />
              </div>
            </div>
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
        
        {/* Token Usage Warning */}
        {isTokenUsageWarning && (
          <div className={`px-6 py-3 border-b ${
            isTokenUsageHigh ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${
                isTokenUsageHigh ? 'text-red-600' : 'text-amber-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isTokenUsageHigh ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {isTokenUsageHigh 
                    ? 'Session approaching token limit' 
                    : 'High token usage detected'
                  }
                </p>
                <p className={`text-xs ${
                  isTokenUsageHigh ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {isTokenUsageHigh
                    ? 'Consider starting a new session to avoid interruptions'
                    : 'This session may reach token limits soon'
                  }
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/dashboard/ideas'}
                className={`${
                  isTokenUsageHigh 
                    ? 'border-red-300 text-red-700 hover:bg-red-100' 
                    : 'border-amber-300 text-amber-700 hover:bg-amber-100'
                } text-xs`}
              >
                Start New Session
              </Button>
            </div>
          </div>
        )}
        
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
                placeholder={isTokenUsageHigh 
                  ? "Session token limit reached. Please start a new session." 
                  : "Type your message..."
                }
                className="min-h-[80px] pr-12 resize-none"
                disabled={isProcessing || isTokenUsageHigh}
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2"
                onClick={handleSend}
                disabled={!message.trim() || isProcessing || isTokenUsageHigh}
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
        
        {/* Progress Panel */}
        {showProgressPanel && (
          <div className="w-80 border-l border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Conversation Progress
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProgressPanel(false)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-full">
              <div className="p-4">
                {/* Always show structured interview-style progress */}
                <StageProgressMeter stageData={stageData} />
              </div>
            </ScrollArea>
          </div>
        )}
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