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
      <div className="flex h-full relative overflow-hidden">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-blue-50/30 to-purple-50/30 backdrop-blur-sm" />
        
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0 relative z-10">
          {/* Header - Only show for existing sessions */}
          {session && (
            <>
              <div className="glass-container bg-white/40 backdrop-blur-md border-b border-white/30 shadow-lg">
                <div className="flex items-center justify-between pl-16 pr-6 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{session.title}</h2>
                      {isInInterviewMode && (
                        <div className="glass-container bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/40 px-3 py-1 rounded-full shadow-lg">
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
                  <div className="flex items-center gap-2">
                    {/* Progress bar for all conversations */}
                    <div className="flex items-center gap-2">
                      <div 
                        className="glass-container bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/40 transition-all duration-300 hover:scale-105 shadow-lg"
                        onClick={() => setShowProgressPanel(!showProgressPanel)}
                        title="Click to view detailed progress"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {stageList.map((stage, index) => (
                              <div 
                                key={stage.id}
                                className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm ${
                                  index <= currentStageIndex ? stage.color : 'bg-gray-300'
                                } ${index === currentStageIndex ? 'ring-2 ring-offset-1 ring-blue-400 scale-125' : ''}`}
                                title={`Stage ${index + 1}`}
                              />
                            ))}
                          </div>
                          <BarChart3 size={14} className="text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelpModal(true)}
                      className="gap-2 glass-container bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-900 transition-all duration-300 hover:scale-105"
                    >
                      <HelpCircle size={16} />
                      Help
                    </Button>
                    {session.can_submit_idea && !session.is_idea_submitted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSubmitDialog(true)}
                        className="gap-2 glass-container bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/40 hover:from-green-500/30 hover:to-emerald-500/30 text-green-700 hover:text-green-800 transition-all duration-300 hover:scale-105 shadow-lg"
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
                        className="gap-2 glass-container bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/40 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-700 hover:text-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
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
              </div>
              
              {/* Token Usage Warning */}
              {isTokenUsageWarning && (
                <div className={`glass-container backdrop-blur-md border-b shadow-lg ${
                  isTokenUsageHigh 
                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-300/40' 
                    : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-300/40'
                }`}>
                  <div className="px-6 py-3">
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
                        onClick={() => window.location.href = '/dashboard/chat'}
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
                </div>
              )}
            </>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            {isEmptyChat ? (
              // Empty chat state with template badges
              <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
                <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 overflow-hidden w-full">
                  <div className="min-h-[50vh] flex flex-col justify-center py-8">
                    <div className="text-center mb-8 sm:mb-12">
                      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        How can I help you today?
                      </h1>
                      <p className="text-base sm:text-lg text-gray-600">
                        Start typing or choose a template
                      </p>
                    </div>
                    
                    {/* Template Badges */}
                    <div className="w-full overflow-hidden">
                      <ScrollArea className="w-full">
                        <div className="flex gap-2 pb-2 px-1 sm:px-2 overflow-x-auto scrollbar-hide">
                          {(isMobile ? templateBadges.slice(0, 5) : templateBadges).map((badge, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`glass-container bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 hover:scale-[1.05] transition-all duration-300 cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap shadow-lg text-sm sm:text-base
                                ${badge.color === 'blue' && 'hover:border-blue-400/50 hover:text-blue-700'}
                                ${badge.color === 'purple' && 'hover:border-purple-400/50 hover:text-purple-700'}
                                ${badge.color === 'green' && 'hover:border-green-400/50 hover:text-green-700'}
                                ${badge.color === 'indigo' && 'hover:border-indigo-400/50 hover:text-indigo-700'}
                                ${badge.color === 'orange' && 'hover:border-orange-400/50 hover:text-orange-700'}
                                ${badge.color === 'pink' && 'hover:border-pink-400/50 hover:text-pink-700'}
                                ${badge.color === 'emerald' && 'hover:border-emerald-400/50 hover:text-emerald-700'}
                                ${badge.color === 'cyan' && 'hover:border-cyan-400/50 hover:text-cyan-700'}
                              `}
                              onClick={() => handleBadgeClick(badge)}
                            >
                              <span className="text-base sm:text-lg mr-1.5 sm:mr-2">{badge.icon}</span>
                              <span className="font-medium">{badge.name}</span>
                            </Badge>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="mt-1" />
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Existing chat messages
              <ScrollArea className="flex-1 px-6">
                <div className="max-w-3xl mx-auto py-6 space-y-6">
                  {session.messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to start</h3>
                        <p className="text-gray-500 text-sm">
                          Type your message below to begin the conversation
                        </p>
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
                          : isCreatingSession
                          ? 'Starting conversation...'
                          : 'AI is thinking...'
                        }
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>
          
          {/* Input Area */}
          <div className={`glass-container bg-white/40 backdrop-blur-md border-t border-white/30 shadow-lg ${
            isEmptyChat ? 'shrink-0' : ''
          }`}>
            <div className={`px-6 py-4 ${isEmptyChat ? 'max-w-3xl mx-auto' : ''}`}>
              <div className={`glass-container bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-lg ${
                isEmptyChat ? 'max-w-none' : 'max-w-3xl mx-auto'
              }`}>
                <div className="space-y-3">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isEmptyChat 
                        ? "Send a message..." 
                        : isTokenUsageHigh 
                        ? "Session token limit reached. Please start a new session." 
                        : "Type your message..."
                    }
                    className={`${
                      isEmptyChat 
                        ? 'min-h-[44px] sm:min-h-[52px] py-2.5 bg-white/60 backdrop-blur-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0' 
                        : 'min-h-[80px] bg-white/50 backdrop-blur-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0'
                    } w-full resize-none transition-all duration-300 text-gray-900 placeholder:text-gray-500`}
                    disabled={isProcessing || isTokenUsageHigh}
                    rows={isEmptyChat ? 1 : undefined}
                    style={isEmptyChat ? { minHeight: '44px' } : undefined}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="glass-container bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      onClick={handleSend}
                      disabled={!message.trim() || isProcessing || isTokenUsageHigh}
                    >
                      <Send size={16} className="text-white" />
                      <span className="text-white">Send</span>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span className={isEmptyChat ? "hidden sm:inline" : ""}>
                    Press Enter to send, Shift+Enter for new line
                  </span>
                  {isEmptyChat && <span className="sm:hidden">Enter to send</span>}
                  <span>
                    {isProcessing 
                      ? (isCreatingSession ? 'Starting...' : 'Processing...') 
                      : isEmptyChat 
                      ? 'Ready' 
                      : 'Ready'
                    }
                  </span>
                  {!isEmptyChat && !isProcessing && (
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Need help?
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Panel - Only for existing sessions */}
        {session && showProgressPanel && (
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