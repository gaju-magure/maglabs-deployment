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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { 
  listChatSessions, 
  createChatSession, 
  archiveSession,
  deleteAllSessions,
  type ChatSession 
} from '@/services/chatApi';

interface ChatSessionSidebarProps {
  onClose?: () => void;
}

export const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
    },
  });
  
  const deleteAllMutation = useMutation({
    mutationFn: deleteAllSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast.success(data.message);
      setShowDeleteAllDialog(false);
      
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
      <div className="w-80 flex flex-col relative overflow-hidden min-w-0 h-full">
        {/* Glass Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-purple-50/80 backdrop-blur-xl border-r border-white/20" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        
        {/* Header with Glass Effect */}
        <div className="relative z-10 p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            
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
        <div className="relative z-10 p-4 border-b border-white/20">
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
                className="pl-10 bg-white/50 backdrop-blur-sm border-white/30 focus:border-blue-400/50 focus:ring-blue-400/30 placeholder:text-gray-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      
        {/* Session List with Glass Effect */}
        <ScrollArea className="relative z-10 flex-1">
          <div className="p-2 space-y-3">
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
                    <div className="space-y-2">
                      {groupSessions.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === sessionId}
                          onClick={() => navigate(`/dashboard/chat/${session.id}`)}
                          onArchive={() => archiveMutation.mutate(session.id)}
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
        <div className="relative z-10 p-4 border-t border-white/20">
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
            {!showArchived && sessions.length > 0 && (
              <div className="glass-container bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md rounded-xl p-2 border border-red-300/30 shadow-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 text-red-700 hover:text-red-800 hover:bg-red-100/50 transition-all duration-300"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={deleteAllMutation.isPending}
                >
                  <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Trash2 size={12} className="text-red-600" />
                  </div>
                  <span className="font-medium">
                    {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All Chats'}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        title="Delete All Conversations"
        description={`Are you sure you want to delete all ${sessions.length} conversation${sessions.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteAllMutation.isPending}
      />
    </>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, onClick, onArchive }) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02]",
        isActive 
          ? "glass-container bg-slate-800/85 backdrop-blur-md border border-slate-600/50 shadow-lg shadow-slate-900/30" 
          : "glass-container bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 hover:shadow-xl hover:border-white/40"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
          isActive 
            ? "bg-slate-700/60 shadow-lg border border-slate-500/30" 
            : "bg-white/20 group-hover:bg-white/30"
        )}>
          <MessageSquare size={14} className={isActive ? "text-gray-200" : "text-gray-600"} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold text-sm truncate transition-colors duration-300",
            isActive ? "text-gray-100" : "text-gray-800 group-hover:text-gray-900"
          )}>
            {session.title}
          </h4>
          <p className={cn(
            "text-xs truncate transition-colors duration-300 mt-1",
            isActive ? "text-gray-300" : "text-gray-500 group-hover:text-gray-600"
          )}>
            {session.last_message_preview}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110",
                isActive ? "text-gray-200 hover:bg-slate-700/50" : "text-gray-600 hover:bg-white/30"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={12} />
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "transition-colors duration-300",
          isActive ? "text-gray-400" : "text-gray-500"
        )}>
          {session.time_ago}
        </span>
        <div className="flex items-center gap-2">
          {session.is_idea_submitted && (
            <div className={cn(
              "glass-container backdrop-blur-sm border px-2 py-1 rounded-lg",
              isActive 
                ? "bg-green-500/20 border-green-400/30" 
                : "bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-400/40"
            )}>
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-green-300" : "text-green-700"
              )}>
                💡 Submitted
              </span>
            </div>
          )}
          {session.message_count > 0 && (
            <div className={cn(
              "glass-container backdrop-blur-sm px-2 py-1 rounded-lg transition-all duration-300",
              isActive 
                ? "bg-slate-700/50 border border-slate-500/30 text-gray-300" 
                : "bg-white/30 border border-white/40 text-gray-600"
            )}>
              <span className="text-xs font-medium">{session.message_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};