import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Archive, Search, MoreHorizontal, Trash2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BeautifulTooltip, ChatSessionTooltipContent } from '@/components/ui/beautiful-tooltip';
import { 
  listChatSessions, 
  createChatSession, 
  archiveSession,
  deleteSession,
  deleteAllSessions,
  type ChatSession 
} from '@/services/chatApi';

interface ChatSessionSidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({ onClose, isMobile = false }) => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['chatSessions', showArchived ? 'archived' : 'active', searchQuery],
    queryFn: () => listChatSessions({
      status: showArchived ? 'archived' : undefined,
      search: searchQuery || undefined,
    }),
  });
  
  const createSessionMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (newSession) => {
      console.log('Chat session created:', newSession);
      
      if (!newSession || !newSession.id) {
        console.error('Session creation succeeded but no valid session ID returned:', newSession);
        toast.error('Failed to create chat session - invalid response from server');
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      navigate(`/dashboard/chat/${newSession.id}`);
    },
    onError: (error) => {
      console.error('Failed to create chat session:', error);
      toast.error('Failed to create chat session. Please try again.');
    },
  });
  
  const archiveMutation = useMutation({
    mutationFn: archiveSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast.success('Chat archived successfully');
    },
    onError: (error) => {
      console.error('Failed to archive session:', error);
      toast.error('Failed to archive chat. Please try again.');
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_, deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast.success('Chat deleted successfully');
      
      // Navigate to chat home if current session was deleted
      if (deletedSessionId === sessionId) {
        navigate('/dashboard/chat');
      }
    },
    onError: (error) => {
      console.error('Failed to delete session:', error);
      if (error.message.includes('submitted idea')) {
        toast.error('Cannot delete chat with submitted idea.');
      } else {
        toast.error('Failed to delete chat. Please try again.');
      }
    },
  });
  
  const deleteAllMutation = useMutation({
    mutationFn: deleteAllSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      const protectedCount = sessions.filter(s => s.is_idea_submitted).length;
      
      if (protectedCount > 0) {
        toast.success(`${data.deleted_count} chats deleted. ${protectedCount} submitted ideas were protected.`);
      } else {
        toast.success(data.message);
      }
      
      // Navigate to chat home if current session was deleted
      if (sessionId) {
        navigate('/dashboard/chat');
      }
    },
    onError: (error) => {
      console.error('Failed to delete all sessions:', error);
      toast.error('Failed to delete all sessions. Please try again.');
    },
  });

  // Helper functions for chat protection
  const canDeleteSession = (session: ChatSession): boolean => {
    return !session.is_idea_submitted;
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSessionMutation.mutate(sessionId);
  };

  const handleDeleteAllSessions = () => {
    deleteAllMutation.mutate();
  };

  // Calculate deletable vs protected sessions
  const deletableSessions = sessions.filter(canDeleteSession);
  const protectedSessions = sessions.filter(s => s.is_idea_submitted);
  
  const handleNewChat = () => {
    createSessionMutation.mutate({
      title: 'New Chat',
    });
  };
  
  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: [],
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.last_activity_at);
      if (sessionDate >= today) {
        groups.Today.push(session);
      } else if (sessionDate >= yesterday) {
        groups.Yesterday.push(session);
      } else if (sessionDate >= weekAgo) {
        groups['Previous 7 Days'].push(session);
      } else if (sessionDate >= monthAgo) {
        groups['Previous 30 Days'].push(session);
      } else {
        groups.Older.push(session);
      }
    });
    
    return groups;
  };
  
  const sessionGroups = groupSessionsByDate(sessions);
  
  return (
    <>
      <div className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col relative overflow-hidden min-w-0 h-full`}>
        {/* Glass Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-purple-50/80 backdrop-blur-xl border-r border-white/20" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        
        {/* Header with Glass Effect */}
        <div className="relative z-10 p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            {/* Mobile close button */}
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={16} />
              </Button>
            )}
            
            <div className="flex-1 glass-container bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-lg transition-all duration-300 hover:bg-white/25 hover:shadow-xl">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start gap-3 bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 text-white border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/25"
                disabled={createSessionMutation.isPending}
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus size={14} className="text-white" />
                </div>
                <span className="font-medium">
                  {createSessionMutation.isPending ? 'Creating...' : 'New Chat'}
                </span>
                <Sparkles size={14} className="ml-auto text-white/70" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Search with Glass Effect */}
        <div className={`relative z-10 ${isMobile ? 'p-3' : 'p-4'} border-b border-white/20`}>
          <div className="glass-container bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-lg">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                <Search className="text-gray-600" size={12} />
              </div>
              <Input
                type="search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 bg-white/50 backdrop-blur-sm border-white/30 focus:border-blue-400/50 focus:ring-blue-400/30 placeholder:text-gray-500 transition-all duration-300 ${isMobile ? 'h-11' : ''}`}
              />
            </div>
          </div>
        </div>
      
        {/* Session List with Glass Effect */}
        <ScrollArea className="relative z-10 flex-1">
          <div className={`${isMobile ? 'p-3' : 'p-2'} space-y-3`}>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="glass-container bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-white/30 rounded w-1/2 mx-auto"></div>
                    <div className="h-3 bg-white/20 rounded w-1/3 mx-auto"></div>
                  </div>
                  <span className="text-gray-600 text-sm">Loading conversations...</span>
                </div>
              </div>
            ) : (
              Object.entries(sessionGroups).map(([groupName, groupSessions]) => {
                if (groupSessions.length === 0) return null;
                
                return (
                  <div key={groupName} className="mb-6">
                    <div className="glass-container bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-3 border border-white/20">
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                        {groupName}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {groupSessions.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === sessionId}
                          onClick={() => navigate(`/dashboard/chat/${session.id}`)}
                          onArchive={() => archiveMutation.mutate(session.id)}
                          onDelete={() => handleDeleteSession(session.id)}
                          isDeleting={deleteSessionMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            
            {!isLoading && sessions.length === 0 && (
              <div className="text-center py-8">
                <div className="glass-container bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="text-gray-500" size={20} />
                  </div>
                  <p className="text-gray-600 text-sm">
                    {searchQuery ? 'No conversations found' : showArchived ? 'No archived conversations' : 'No conversations yet'}
                  </p>
                  {!searchQuery && !showArchived && (
                    <p className="text-gray-500 text-xs mt-2">
                      Click "New Chat" to start your first conversation
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      
        {/* Footer with Glass Effect */}
        <div className={`relative z-10 ${isMobile ? 'p-3' : 'p-4'} border-t border-white/20`}>
          <div className="space-y-3">
            {/* Archive Toggle */}
            <div className="glass-container bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/30 shadow-lg">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 hover:bg-white/20 transition-all duration-300"
                onClick={() => setShowArchived(!showArchived)}
              >
                <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Archive size={12} className="text-gray-600" />
                </div>
                <span className="text-gray-700 font-medium">
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </span>
              </Button>
            </div>
            
            {/* Delete All Button */}
            {!showArchived && deletableSessions.length > 0 && (
              <div className="glass-container bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md rounded-xl p-2 border border-red-300/30 shadow-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 text-red-700 hover:text-red-800 hover:bg-red-100/50 transition-all duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteAllSessions();
                  }}
                  disabled={deleteAllMutation.isPending}
                >
                  <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Trash2 size={12} className="text-red-600" />
                  </div>
                  <span className="font-medium">
                    {deleteAllMutation.isPending ? 'Deleting...' : `Delete ${deletableSessions.length} Chat${deletableSessions.length !== 1 ? 's' : ''}`}
                  </span>
                </Button>
                {protectedSessions.length > 0 && (
                  <p className="text-xs text-red-600 mt-1 px-2">
                    {protectedSessions.length} submitted idea{protectedSessions.length !== 1 ? 's' : ''} will be protected
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
    </>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, onClick, onArchive, onDelete, isDeleting }) => {
  return (
    <BeautifulTooltip
      content={
        <ChatSessionTooltipContent
          title={session.title}
          preview={session.last_message_preview || ''}
          timeAgo={session.time_ago}
          messageCount={session.message_count}
          isIdeaSubmitted={session.is_idea_submitted}
        />
      }
      variant="glass"
      size="lg"
      position="right"
      mobileEnabled={false} // Disable on mobile to avoid conflicts with touch interactions
    >
      <div
        className={cn(
          "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-300",
          isActive 
            ? "glass-container bg-slate-800/85 backdrop-blur-md border border-slate-600/50 shadow-lg shadow-slate-900/30" 
            : "glass-container bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 hover:shadow-xl hover:border-white/40"
        )}
        onClick={onClick}
      >
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300",
          isActive 
            ? "bg-slate-700/60 shadow-lg border border-slate-500/30" 
            : "bg-white/20 group-hover:bg-white/30"
        )}>
          <MessageSquare size={12} className={isActive ? "text-gray-200" : "text-gray-600"} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-sm truncate transition-colors duration-300",
            isActive ? "text-gray-100" : "text-gray-800 group-hover:text-gray-900"
          )}>
            {session.title}
          </h4>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {session.is_idea_submitted && (
            <div className={cn(
              "w-2 h-2 rounded-full",
              isActive ? "bg-green-400" : "bg-green-500"
            )}
            title="Idea Submitted"
            />
          )}
          {session.message_count > 0 && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-md transition-all duration-300",
              isActive 
                ? "bg-slate-700/50 border border-slate-500/30 text-gray-300" 
                : "bg-white/30 border border-white/40 text-gray-600"
            )}>
              {session.message_count}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 opacity-0 group-hover:opacity-100 transition-all duration-300",
                  isActive ? "text-gray-200 hover:bg-slate-700/50" : "text-gray-600 hover:bg-white/30"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={10} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-container bg-white/80 backdrop-blur-md border border-white/30">
              <DropdownMenuItem 
                onClick={onArchive}
                className="hover:bg-white/50 transition-colors duration-200"
              >
                <Archive size={14} className="mr-2" />
                Archive
              </DropdownMenuItem>
              {!session.is_idea_submitted ? (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash2 size={14} className="mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              ) : (
                <BeautifulTooltip
                  content="Submitted ideas cannot be deleted for compliance reasons"
                  variant="warning"
                  size="sm"
                >
                  <DropdownMenuItem 
                    disabled
                    className="text-gray-400 cursor-not-allowed"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete (Protected)
                  </DropdownMenuItem>
                </BeautifulTooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </BeautifulTooltip>
  );
};