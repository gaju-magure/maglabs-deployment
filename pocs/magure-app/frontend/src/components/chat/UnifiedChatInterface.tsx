import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, RefreshCw, Lightbulb, MoreVertical, Sparkles, HelpCircle, ChevronRight, MessageSquare, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  createChatSession,
  type ChatSessionDetail,
  type SendMessageRequest,
} from '@/services/chatApi';

interface TemplateBadge {
  name: string;
  icon: string;
  prompt: string;
  color: string;
}

interface UnifiedChatInterfaceProps {
  session?: ChatSessionDetail;
  onNewChat?: (sessionId: string) => void;
}

const templateBadges: TemplateBadge[] = [
  { name: "Brainstorm", icon: "💡", prompt: "Help me brainstorm ideas for ", color: "blue" },
  { name: "Refine Idea", icon: "⭐", prompt: "I have an idea I'd like to refine: ", color: "purple" },
  { name: "Solve Problem", icon: "🔧", prompt: "I need help solving this problem: ", color: "green" },
  { name: "Business Plan", icon: "📋", prompt: "Help me create a business plan for ", color: "indigo" },
  { name: "Market Research", icon: "📊", prompt: "I need market research on ", color: "orange" },
  { name: "Interview Mode", icon: "🎯", prompt: "Start interview mode for comprehensive analysis of my idea: ", color: "pink" },
  { name: "Cost Analysis", icon: "💰", prompt: "Help me analyze the costs for ", color: "emerald" },
  { name: "Tech Solution", icon: "🚀", prompt: "I need a technical solution for ", color: "cyan" }
];

export const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({ session, onNewChat }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmptyChat = !session;

  // Check if mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Focus on desktop only to avoid mobile keyboard popup
    if (!isMobile && isEmptyChat) {
      textareaRef.current?.focus();
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isEmptyChat, isMobile]);

  // Extract stage progression data from messages (only if session exists)
  const stageData = session ? getLatestStageProgression(session.messages) : null;
  const hasStageProgression = session ? hasActiveStageProgression(session.messages) : false;
  
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
  
  const currentStageIndex = stageData ? stageList.findIndex(stage => stage.id === (stageData.stage_name || 'initialization')) : -1;

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => sendMessage(session!.id, data),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session!.id], response.session_updated);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setMessage('');
      scrollToBottom();
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to send message. Please try again.";
      let isTokenLimitError = false;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { status?: number; data?: { detail?: string } }; message?: string };
        if (responseError.response?.status === 500) {
          const errorText = responseError.response?.data?.detail || responseError.message || '';
          if (errorText.includes('token') && (errorText.includes('limit') || errorText.includes('exceed'))) {
            isTokenLimitError = true;
            errorMessage = "Session token limit exceeded. The conversation has become too long. Please start a new session to continue.";
          } else {
            errorMessage = "Server error occurred. Our team has been notified. Please try again.";
          }
        } else if (responseError.response?.status === 503) {
          errorMessage = "AI service is temporarily unavailable. Please check your connection and try again.";
        } else if (responseError.response?.status === 502) {
          errorMessage = "Received invalid response from AI service. Please try rephrasing your message.";
        } else if (responseError.response?.status && responseError.response.status >= 500) {
          errorMessage = "Server error occurred. Our team has been notified. Please try again.";
        } else if (responseError.message) {
          errorMessage = responseError.message;
        }
      }
      
      toast({
        title: isTokenLimitError ? "Session Limit Reached" : "Error",
        description: errorMessage,
        variant: "destructive",
        action: isTokenLimitError ? (
          <button
            onClick={() => window.location.href = '/dashboard/chat'}
            className="text-sm underline text-white hover:no-underline"
          >
            Start New Session
          </button>
        ) : undefined,
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateResponse(session!.id),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session!.id], response.session_updated);
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
    mutationFn: (title: string) => updateSessionTitle(session!.id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatSession', session!.id] });
    },
  });

  const startInterviewMutation = useMutation({
    mutationFn: (message?: string) => startInterview(session!.id, message),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session!.id], response.session_updated);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast({
        title: "Interview Started",
        description: "AI interview mode activated for comprehensive idea development.",
      });
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to start interview mode.";
      let isTokenLimitError = false;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { status?: number; data?: { detail?: string } }; message?: string };
        if (responseError.response?.status === 500) {
          const errorText = responseError.response?.data?.detail || responseError.message || '';
          if (errorText.includes('token') && (errorText.includes('limit') || errorText.includes('exceed'))) {
            isTokenLimitError = true;
            errorMessage = "Session token limit exceeded. Cannot start interview mode in this session. Please start a new session.";
          } else {
            errorMessage = "Server error occurred while starting interview. Please try again later.";
          }
        } else if (responseError.response?.status === 503) {
          errorMessage = "AI service is unavailable. Please ensure the MagLabs VLLM API is running and try again.";
        } else if (responseError.response?.status === 502) {
          errorMessage = "AI service returned an invalid response. Please try again.";
        } else if (responseError.response?.status && responseError.response.status >= 500) {
          errorMessage = "Server error occurred while starting interview. Please try again later.";
        } else if (responseError.message) {
          errorMessage = responseError.message;
        }
      }
      
      toast({
        title: isTokenLimitError ? "Session Limit Reached" : "Interview Mode Error",
        description: errorMessage,
        variant: "destructive",
        action: isTokenLimitError ? (
          <button
            onClick={() => window.location.href = '/dashboard/chat'}
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
    if (session) {
      scrollToBottom();
    }
  }, [session?.messages, session]);

  const handleSend = async () => {
    if (!message.trim() || isCreatingSession) return;

    if (isEmptyChat) {
      // Create new session
      setIsCreatingSession(true);
      
      try {
        const newSession = await createChatSession({
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          initial_message: message,
        });
        
        if (!newSession || !newSession.id) {
          throw new Error('Invalid session response');
        }
        
        if (onNewChat) {
          onNewChat(newSession.id);
        }
      } catch (error) {
        console.error('Failed to create chat session:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive",
        });
        setIsCreatingSession(false);
      }
    } else {
      // Send message to existing session
      if (sendMessageMutation.isPending || isTokenUsageHigh) return;
      
      sendMessageMutation.mutate({
        content: message.trim(),
        message_type: 'text',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (isEmptyChat) {
      // Auto-resize textarea for empty chat
      const textarea = e.target;
      const minHeight = window.innerWidth < 640 ? 44 : 52;
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${Math.max(newHeight, minHeight)}px`;
    }
  };

  const handleBadgeClick = (badge: TemplateBadge) => {
    setMessage(badge.prompt);
    textareaRef.current?.focus();
    setTimeout(() => {
      if (textareaRef.current) {
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleEditTitle = () => {
    if (!session) return;
    const newTitle = prompt('Enter new title:', session.title);
    if (newTitle && newTitle !== session.title) {
      updateTitleMutation.mutate(newTitle);
    }
  };

  const handleStartInterview = () => {
    if (!session) return;
    const interviewMessage = "I have a business idea I want to develop comprehensively";
    startInterviewMutation.mutate(interviewMessage);
  };

  const isProcessing = sendMessageMutation.isPending || regenerateMutation.isPending || startInterviewMutation.isPending || isCreatingSession;
  const isInInterviewMode = session?.ai_metadata?.interview_mode;
  const isTokenUsageHigh = session ? session.total_tokens_used > 90000 : false;
  const isTokenUsageWarning = session ? session.total_tokens_used > 80000 : false;

  return (
    <>
      <div className="flex h-full chat-container">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header - Only show for existing sessions */}
          {session && (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto pl-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{session.title}</h2>
                      {isInInterviewMode && (
                        <div className="bg-purple-100 border border-purple-200 px-3 py-1 rounded-full">
                          <span className="text-purple-800 text-xs font-medium flex items-center gap-1">
                            <Sparkles size={12} />
                            Interview Mode
                          </span>
                        </div>
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
                  <div className="flex items-center gap-3">
                    {/* Simplified progress indicator */}
                    <button 
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setShowProgressPanel(!showProgressPanel)}
                      title="View conversation progress"
                    >
                      <div className="flex items-center gap-1">
                        {stageList.map((stage, index) => (
                          <div 
                            key={stage.id}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index <= currentStageIndex ? stage.color : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <BarChart3 size={14} className="text-gray-500" />
                    </button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelpModal(true)}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <HelpCircle size={16} />
                    </Button>
                    {session.can_submit_idea && !session.is_idea_submitted && (
                      <Button
                        size="sm"
                        onClick={() => setShowSubmitDialog(true)}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Lightbulb size={16} />
                        Submit Idea
                      </Button>
                    )}
                    {!isInInterviewMode && session.message_count === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartInterview}
                        disabled={startInterviewMutation.isPending}
                        className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Sparkles size={16} />
                        Interview Mode
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
              </div>
              
              {/* Token Usage Warning */}
              {isTokenUsageWarning && (
                <div className={`border-b px-6 py-3 ${
                  isTokenUsageHigh 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
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
                      onClick={() => window.location.href = '/dashboard/chat'}
                      className={`${
                        isTokenUsageHigh 
                          ? 'border-red-300 text-red-700 hover:bg-red-100' 
                          : 'border-amber-300 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      New Session
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            {isEmptyChat ? (
              // Empty chat state with template badges
              <div className="h-full flex flex-col">
                <div className="flex-1 flex flex-col justify-center px-6 py-12">
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-12">
                      <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                        How can I help you today?
                      </h1>
                      <p className="text-lg text-gray-600">
                        Start a conversation or choose a template below
                      </p>
                    </div>
                    
                    {/* Template Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {templateBadges.map((badge, index) => (
                        <div
                          key={index}
                          className="chat-template-card text-left"
                          onClick={() => handleBadgeClick(badge)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{badge.icon}</span>
                            <div>
                              <h3 className="font-medium text-gray-900 text-sm">{badge.name}</h3>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {badge.prompt}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Existing chat messages
              <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto px-6 py-8">
                  {session.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to chat</h3>
                      <p className="text-gray-500 text-sm">
                        Type your message below to start the conversation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {session.messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                      ))}
                    </div>
                  )}
                  {isProcessing && (
                    <div className="flex items-center gap-3 mt-6 mb-2">
                      <div className="chat-avatar chat-avatar-ai">
                        <Bot size={16} />
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <RefreshCw className="animate-spin" size={16} />
                        <span className="text-sm">
                          {startInterviewMutation.isPending 
                            ? 'Starting interview mode...' 
                            : isCreatingSession
                            ? 'Starting conversation...'
                            : 'AI is thinking...'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>
          
          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-white border border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md focus-within:border-green-400 focus-within:shadow-sm transition-all">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isTokenUsageHigh 
                      ? "Session token limit reached. Please start a new session." 
                      : "Message AI Assistant..."
                  }
                  className="chat-input min-h-[52px] w-full pr-12 resize-none border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-500 focus:ring-0"
                  disabled={isProcessing || isTokenUsageHigh}
                  rows={1}
                />
                <button
                  className="chat-send-button absolute bottom-3 right-3"
                  onClick={handleSend}
                  disabled={!message.trim() || isProcessing || isTokenUsageHigh}
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <div className="flex items-center gap-4">
                  <span>
                    {isProcessing 
                      ? (isCreatingSession ? 'Starting...' : 'Processing...') 
                      : 'Ready'
                    }
                  </span>
                  {!isEmptyChat && !isProcessing && (
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Help
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Panel - Only for existing sessions */}
        {session && showProgressPanel && (
          <div className="w-80 border-l border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Progress
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProgressPanel(false)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-full">
              <div className="p-4">
                {stageData && <StageProgressMeter stageData={stageData} />}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      
      {/* Modals - Only for existing sessions */}
      {session && showSubmitDialog && (
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
      
      <ChatHelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </>
  );
};