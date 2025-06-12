import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pin, Heart, User, Clock, Calendar, Loader2, Activity, Settings, FileText, Building2, Briefcase } from 'lucide-react';
import { Idea, updateIdeaStatus } from '@/services/ideasApi';
import { IdeaStatusLabels, IdeaStickyNoteColors, IdeaStatus } from '@/enums/ideaStatus';
import { useToast } from '@/hooks/use-toast';

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string, currentlyLiked: boolean) => void;
  onPin?: (id: string) => void;
  onStatusUpdate?: (updatedIdea: Idea) => void;
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
  onStatusUpdate,
  isLiking,
  isPinning,
  isAdmin,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!idea || !onStatusUpdate) return;
    
    try {
      setIsUpdatingStatus(true);
      const updatedIdea = await updateIdeaStatus(idea.id, { status: newStatus });
      onStatusUpdate(updatedIdea);
      toast({
        title: "Status Updated",
        description: `Idea status changed to ${IdeaStatusLabels[newStatus as keyof typeof IdeaStatusLabels]}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update idea status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStickyNoteBackground = () => {
    const statusStyle = IdeaStickyNoteColors[idea.status as IdeaStatus] || IdeaStickyNoteColors[IdeaStatus.Submitted];
    return statusStyle.split(' ').slice(0, 4).join(' '); // Get just the background gradient classes
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] sm:w-full overflow-hidden border-2 shadow-2xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {/* Status-based gradient header */}
        <div className={`absolute top-0 left-0 right-0 h-24 ${getStickyNoteBackground()} opacity-30`}></div>
        
        {/* Header */}
        <DialogHeader className="relative z-10 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-4 ring-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 text-lg font-bold">
                {getAuthorInitials(idea.user_email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {idea.title}
                    {idea.is_pinned && (
                      <div className="inline-block ml-3">
                        <div className="relative">
                          <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-md border border-red-700">
                            <div className="absolute inset-0.5 bg-gradient-to-br from-red-300 to-red-400 rounded-full"></div>
                          </div>
                          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-gray-600"></div>
                        </div>
                      </div>
                    )}
                  </DialogTitle>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{idea.user_email.split('@')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{getRelativeTime(idea.created_at)}</span>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {IdeaStatusLabels[idea.status as keyof typeof IdeaStatusLabels] || idea.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAdmin && onPin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPin(idea.id)}
                      disabled={isPinning}
                      className={`rounded-full w-10 h-10 p-0 transition-all duration-200 ${
                        idea.is_pinned 
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-600'
                      }`}
                      title={idea.is_pinned ? 'Unpin idea' : 'Pin idea'}
                    >
                      {isPinning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pin className={`w-4 h-4 ${idea.is_pinned ? 'fill-current' : ''}`} />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLike(idea.id, idea.is_liked)}
                    disabled={isLiking}
                    className={`rounded-full w-10 h-10 p-0 transition-all duration-200 ${
                      idea.is_liked 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-600'
                    }`}
                    title={idea.is_liked ? 'Unlike idea' : 'Like idea'}
                  >
                    {isLiking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 ${idea.is_liked ? 'fill-current' : ''}`} />
                    )}
                  </Button>
                  
                  <span className="text-sm text-gray-600 font-medium">
                    {idea.like_count} {idea.like_count === 1 ? 'like' : 'likes'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tabbed Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="management" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Management
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Description
                  </h3>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {idea.description}
                    </p>
                  </div>
                </div>

                {/* Department and Role Info */}
                {(idea.department_name || idea.custom_role_name) && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Team Context
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {idea.department_name && (
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            {idea.department_name}
                          </span>
                        </div>
                      )}
                      {idea.custom_role_name && (
                        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                          <Briefcase className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                            {idea.custom_role_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-0">
                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Created
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(idea.created_at)}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      Last Updated
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(idea.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Engagement Stats */}
                <div className="bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/10 dark:to-red-900/10 rounded-lg p-6 border border-pink-100 dark:border-pink-900/20">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Engagement
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-red-600 fill-current" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {idea.like_count}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {idea.like_count === 1 ? 'like' : 'likes'}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="management" className="space-y-6 mt-0">
                  {/* Status Management */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      Status Management
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Status
                        </label>
                        <Select
                          value={idea.status}
                          onValueChange={handleStatusUpdate}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(IdeaStatusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {isUpdatingStatus && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating status...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Idea Metadata */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      System Information
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {idea.id}
                    </p>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};