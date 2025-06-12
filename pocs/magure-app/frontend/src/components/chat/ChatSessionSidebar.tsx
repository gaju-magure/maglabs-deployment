import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Archive, Search, MoreHorizontal } from 'lucide-react';
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
import { 
  listChatSessions, 
  createChatSession, 
  archiveSession,
  type ChatSession 
} from '@/services/chatApi';

export const ChatSessionSidebar: React.FC = () => {
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
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      navigate(`/dashboard/chat/${newSession.id}`);
    },
  });
  
  const archiveMutation = useMutation({
    mutationFn: archiveSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
  
  const handleNewChat = () => {
    createSessionMutation.mutate({
      title: 'New Chat',
      conversation_type: 'general',
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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          disabled={createSessionMutation.isPending}
        >
          <Plus size={20} />
          {createSessionMutation.isPending ? 'Creating...' : 'New Chat'}
        </Button>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            Object.entries(sessionGroups).map(([groupName, groupSessions]) => {
              if (groupSessions.length === 0) return null;
              
              return (
                <div key={groupName} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                    {groupName}
                  </h3>
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
              );
            })
          )}
          
          {!isLoading && sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No conversations found' : showArchived ? 'No archived conversations' : 'No conversations yet'}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={16} />
          {showArchived ? 'Show Active' : 'Show Archived'}
        </Button>
      </div>
    </div>
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
        "group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{session.title}</h4>
          <p className="text-xs text-gray-500 truncate">{session.last_message_preview}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onArchive}>
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{session.time_ago}</span>
        <div className="flex items-center gap-1">
          {session.is_idea_submitted && (
            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
              Submitted
            </span>
          )}
          {session.message_count > 0 && (
            <span className="text-gray-400">{session.message_count}</span>
          )}
        </div>
      </div>
    </div>
  );
};