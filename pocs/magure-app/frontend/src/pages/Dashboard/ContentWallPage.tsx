import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, Loader2, Sparkles, Clock, User } from 'lucide-react';
import { getContentWallIdeas, toggleIdeaPin, type Idea } from '@/services/ideasApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const ContentWallPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is admin (can pin/unpin ideas)
  const isAdmin = user?.role === 'superadmin' || user?.role === 'tenant_admin';

  // Load content wall ideas on mount
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setLoading(true);
        const data = await getContentWallIdeas();
        setIdeas(data);
        setError(null);
      } catch (err) {
        setError('Failed to load ideas');
        toast({
          title: "Error",
          description: "Failed to load content wall ideas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadIdeas();
  }, [toast]);

  const handleTogglePin = async (id: string) => {
    try {
      setTogglingPin(id);
      const updatedIdea = await toggleIdeaPin(id);
      
      // Update the idea in the local state
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === id ? updatedIdea : idea
        )
      );

      toast({
        title: "Success",
        description: `Idea ${updatedIdea.is_pinned ? 'pinned' : 'unpinned'} successfully`,
      });
    } catch (err) {
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthorInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="flex items-center justify-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text animate-spin" />
            </div>
          </div>
        </div>
        <span className="text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>Loading ideas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center animate-in slide-in-from-bottom duration-300">
          <p className="text-red-600 mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200"
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Ideas Wall
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Discover and explore refined ideas from your team
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {ideas.length === 0 ? (
          <div className="text-center py-16 animate-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              No refined ideas yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Ideas submitted through the idea chat will appear here. Start sharing your innovative thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ideas.map((idea, index) => (
              <Card 
                key={idea.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-in slide-in-from-bottom ${
                  idea.is_pinned 
                    ? 'ring-2 ring-yellow-200 dark:ring-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20' 
                    : 'hover:scale-[1.02] transform'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  fontFamily: 'Satoshi, sans-serif'
                }}
              >
                {idea.is_pinned && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-yellow-400">
                    <Pin className="absolute -top-8 -right-7 w-4 h-4 text-white transform rotate-45" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12 ring-2 ring-gray-200 dark:ring-gray-700">
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                          {getAuthorInitials(idea.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {idea.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{idea.user_email.split('@')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{getRelativeTime(idea.created_at)}</span>
                          </div>
                          <Badge 
                            variant={idea.status === 'refined' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {idea.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePin(idea.id)}
                        disabled={togglingPin === idea.id}
                        className={`ml-4 transition-all duration-200 ${
                          idea.is_pinned 
                            ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                        }`}
                      >
                        {togglingPin === idea.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Pin className={`w-4 h-4 ${idea.is_pinned ? 'fill-current' : ''}`} />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {idea.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};