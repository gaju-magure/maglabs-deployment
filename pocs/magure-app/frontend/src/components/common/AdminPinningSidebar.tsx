import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pin, 
  PinOff, 
  Loader2, 
  Settings, 
  ChevronRight,
  Users,
  Building2,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { getContentWallIdeas, toggleIdeaPin, type Idea } from '@/services/ideasApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminPinningSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onIdeaUpdate?: (idea: Idea) => void;
}

interface PinnedIdea extends Idea {
  is_visible?: boolean;
}

export const AdminPinningSidebar: React.FC<AdminPinningSidebarProps> = ({
  isOpen,
  onToggle,
  onIdeaUpdate
}) => {
  const [pinnedIdeas, setPinnedIdeas] = useState<PinnedIdea[]>([]);
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'pinned' | 'all'>('pinned');
  const { toast } = useToast();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load ideas when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadIdeas();
    }
  }, [isOpen]);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      const data = await getContentWallIdeas();
      
      const pinned = data.filter(idea => idea.is_pinned);
      
      setPinnedIdeas(pinned);
      setAllIdeas(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load ideas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      setTogglingPin(id);
      const updatedIdea = await toggleIdeaPin(id);
      
      // Update local state
      if (updatedIdea.is_pinned) {
        setPinnedIdeas(prev => [...prev, updatedIdea]);
      } else {
        setPinnedIdeas(prev => prev.filter(idea => idea.id !== id));
      }
      
      setAllIdeas(prev => 
        prev.map(idea => idea.id === id ? updatedIdea : idea)
      );

      // Notify parent component
      onIdeaUpdate?.(updatedIdea);

      toast({
        title: "Success",
        description: `Idea ${updatedIdea.is_pinned ? 'pinned' : 'unpinned'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle pin status",
        variant: "destructive",
      });
    } finally {
      setTogglingPin(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthorInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const displayIdeas = selectedTab === 'pinned' ? pinnedIdeas : allIdeas;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className={cn(
          "fixed top-20 right-4 z-50 shadow-lg bg-white/80 backdrop-blur-sm border-gray-200",
          "hover:bg-white hover:scale-105 transition-all duration-200",
          "lg:hidden"
        )}
      >
        <Settings className="w-4 h-4" />
        Admin
      </Button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50",
          "lg:relative lg:translate-x-0 lg:shadow-none lg:border-l lg:w-96",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Admin Panel
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTab('pinned')}
              className={cn(
                "flex-1 text-xs font-medium transition-all duration-200",
                selectedTab === 'pinned'
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Pin className="w-3 h-3 mr-1" />
              Pinned ({pinnedIdeas.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTab('all')}
              className={cn(
                "flex-1 text-xs font-medium transition-all duration-200",
                selectedTab === 'all'
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Users className="w-3 h-3 mr-1" />
              All ({allIdeas.length})
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : displayIdeas.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                {selectedTab === 'pinned' ? (
                  <Pin className="w-5 h-5 text-gray-400" />
                ) : (
                  <Users className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {selectedTab === 'pinned' ? 'No pinned ideas yet' : 'No ideas found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayIdeas.map((idea) => (
                <Card 
                  key={idea.id} 
                  className={cn(
                    "relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer",
                    idea.is_pinned && "ring-1 ring-yellow-200 dark:ring-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/10"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {idea.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium truncate">{idea.user_email.split('@')[0]}</span>
                          <span>•</span>
                          <span>{formatDate(idea.created_at)}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(idea.id);
                        }}
                        disabled={togglingPin === idea.id}
                        className={cn(
                          "h-7 w-7 p-0 shrink-0 transition-all duration-200",
                          idea.is_pinned 
                            ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                        )}
                      >
                        {togglingPin === idea.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : idea.is_pinned ? (
                          <PinOff className="w-3 h-3" />
                        ) : (
                          <Pin className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {idea.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={idea.status === 'refined' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {idea.status}
                        </Badge>
                        {idea.department_name && (
                          <Badge variant="outline" className="text-xs">
                            <Building2 className="w-2 h-2 mr-1" />
                            {idea.department_name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{idea.like_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Quick Stats */}
              <Separator className="my-4" />
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Quick Stats
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{pinnedIdeas.length}</div>
                    <div className="text-gray-500 dark:text-gray-400">Pinned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{allIdeas.length}</div>
                    <div className="text-gray-500 dark:text-gray-400">Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
};