import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pin, Heart, User, Clock, Calendar, Loader2, X } from 'lucide-react';
import { Idea } from '@/services/ideasApi';

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string, currentlyLiked: boolean) => void;
  onPin?: (id: string) => void;
  isLiking: boolean;
  isPinning: boolean;
  isAdmin: boolean;
}

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  isOpen,
  onClose,
  onLike,
  onPin,
  isLiking,
  isPinning,
  isAdmin,
}) => {
  if (!idea) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {/* Header */}
        <DialogHeader className="relative pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-0 top-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col sm:flex-row items-start gap-4 pr-8">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-gray-200 dark:ring-gray-700">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-sm sm:text-lg font-semibold">
                {getAuthorInitials(idea.user_email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {idea.title}
                    {idea.is_pinned && (
                      <Pin className="inline-block w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 ml-2 fill-current" />
                    )}
                  </DialogTitle>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{idea.user_email.split('@')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{getRelativeTime(idea.created_at)}</span>
                    </div>
                    <Badge 
                      variant={idea.status === 'refined' ? 'default' : 'secondary'}
                      className="capitalize w-fit"
                    >
                      {idea.status}
                    </Badge>
                  </div>
                </div>
                
                {isAdmin && onPin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPin(idea.id)}
                    disabled={isPinning}
                    className={`transition-all duration-200 ${
                      idea.is_pinned 
                        ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                    }`}
                  >
                    {isPinning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pin className={`w-4 h-4 ${idea.is_pinned ? 'fill-current' : ''}`} />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-6" />

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {idea.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Created</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(idea.created_at)}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Last Updated</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(idea.updated_at)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Engagement Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(idea.id, idea.is_liked)}
                disabled={isLiking}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  idea.is_liked 
                    ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                }`}
              >
                {isLiking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${idea.is_liked ? 'fill-current' : ''}`} />
                )}
                <span className="text-sm font-medium">
                  {idea.like_count} {idea.like_count === 1 ? 'like' : 'likes'}
                </span>
              </Button>
            </div>
            
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              ID: {idea.id}
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};