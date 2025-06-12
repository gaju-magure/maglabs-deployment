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
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto border-0 shadow-2xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {/* Header */}
        <DialogHeader className="relative pb-6 border-b border-gray-100 dark:border-gray-800">
          
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-offset-2 ring-blue-200 dark:ring-blue-800 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-sm sm:text-lg font-semibold">
                {getAuthorInitials(idea.user_email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2 leading-tight">
                    {idea.title}
                    {idea.is_pinned && (
                      <Pin className="inline-block w-4 h-4 sm:w-5 sm:h-5 text-amber-500 ml-2 fill-current" />
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
                      className="capitalize w-fit bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800"
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
                    className={`transition-all duration-200 rounded-lg shadow-sm ${
                      idea.is_pinned 
                        ? 'text-amber-600 hover:text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 shadow-amber-200' 
                        : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10'
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
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Description
            </h3>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {idea.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                Created
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(idea.created_at)}</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Last Updated
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(idea.updated_at)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Engagement Actions */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-lg p-4 border border-red-100 dark:border-red-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(idea.id, idea.is_liked)}
                  disabled={isLiking}
                  className={`flex items-center gap-2 transition-all duration-200 rounded-lg shadow-sm ${
                    idea.is_liked 
                      ? 'text-red-500 hover:text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40 shadow-red-200' 
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
              
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                ID: {idea.id}
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};