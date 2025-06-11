import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, Loader2 } from 'lucide-react';
import { getContentWallIdeas, toggleIdeaPin, type Idea } from '@/services/ideasApi';
import { useToast } from '@/hooks/use-toast';

export const ContentWallPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-gray-600">Loading ideas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Wall Section */}
      <div>
        <div className="grid gap-6">
          {ideas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No refined ideas yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Ideas submitted through the idea chat will appear here
              </p>
            </div>
          ) : (
            ideas.map((idea) => (
              <Card key={idea.id} className="relative">
                {idea.is_pinned && (
                  <div className="absolute top-4 right-4">
                    <Pin className="h-4 w-4 text-yellow-600 fill-current" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {getAuthorInitials(idea.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{idea.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{idea.user_email}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{formatDate(idea.created_at)}</span>
                          <Badge variant="secondary">
                            {idea.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(idea.id)}
                      disabled={togglingPin === idea.id}
                      className="text-gray-400 hover:text-yellow-600"
                    >
                      {togglingPin === idea.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pin className={`h-4 w-4 ${idea.is_pinned ? 'text-yellow-600 fill-current' : ''}`} />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};